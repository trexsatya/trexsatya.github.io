package com.srai.route;

import com.srai.predicate.ValidZipCodePredicate;
import com.srai.service.ZipCodes;
import org.apache.camel.LoggingLevel;
import org.apache.camel.NamedNode;
import org.apache.camel.Processor;
import org.apache.camel.builder.RouteBuilder;
import org.apache.camel.model.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.util.*;
import java.util.stream.Collectors;

import static java.lang.String.join;

@Component
public class VoterProcessingRoute extends RouteBuilder {

  @PostConstruct
  public void afterInitialisation(){

    List<RouteDefinition> routes = this.getRouteCollection().getRoutes();
    System.out.println("Satya routes="+routes.size());

    routes.stream().forEach(routeDefinition -> {
      List<FromDefinition> inputs = routeDefinition.getInputs();
      List<ProcessorDefinition<?>> outputs = routeDefinition.getOutputs();

      System.out.println(inputs);
      System.out.println(outputs);
    });

  }

  @Autowired
  private ZipCodes zipCodes;

  @Override
  public void configure() throws Exception {
    from("seda:batchVoterChannel")
    .routeId("VoterBatchSpliter")
    .setHeader("batch_timestamp", constant(Calendar.getInstance().getTimeInMillis()))
    .log(LoggingLevel.INFO, "Voter processing STARTED")
    .split(body())
    .to("seda:singleVoterChannel");

    from("seda:singleVoterChannel")
    .routeId("VoterZipcodeValidator")
    .filter(new ValidZipCodePredicate(zipCodes))
    .to("seda:votersWithValidZipCodeChannel");

    from("seda:votersWithValidZipCodeChannel")
    .routeId("VoterRegistrationSpliter")
    .choice()
    .when().simple("${body.isRegistered}")
    .to("seda:registrationValidationChannel")
    .otherwise()
    .to("seda:unregisteredVoterChannel");

    from("seda:registrationValidationChannel")
    .routeId("VoterRegistrationValidation")
    .transform().method("externalVoterRegistrationGatewayImpl", "verifyRegistration")
    .choice()
    .when().simple("${body.isRegistered}")
    .to("seda:registeredVoterChannel")
    .otherwise()
    .to("seda:unregisteredVoterChannel");

    getRouteCollection().getRoutes().forEach(route -> {
         addConnections( normalizedName(route.getInputs().get(0)), route.getOutputs(), idManager);

         idManager.printConnections();

      System.out.println("\n\n");
    });

  }

  Random random = new Random();

  IdManager idManager = new IdManager();

  String normalizedName(Object object){
    if(object instanceof FromDefinition) return ((FromDefinition)object).getUriOrRef().toString();

    if(object instanceof ToDefinition) return ((ToDefinition)object).getUriOrRef();

    if(object instanceof NamedNode) {
      NamedNode nn = (NamedNode) object;
      return nn.getLabel();
    }

    if(object instanceof ExpressionNode){
      return ((ExpressionNode)object).getExpression().toString();
    }

    if(object instanceof SplitDefinition) return ((SplitDefinition)object).getExpression().toString();

    return object.toString();
  }

  void addConnections(Object in, List<ProcessorDefinition<?>> outs, IdManager idManager){
    if(outs == null || outs.isEmpty()) return;

    outs.forEach(out -> {

      if(out instanceof ChoiceDefinition){
        ChoiceDefinition choice = (ChoiceDefinition) out;

        String choiceId = "choice-"+ random.nextInt();

        idManager.addConnection(normalizedName(in), choiceId);

        List<WhenDefinition> whenClauses = choice.getWhenClauses();

        whenClauses.stream().forEach(whenDefinition -> {
          String whenClauseId = "when("+ whenDefinition.getExpression() +")-" + random.nextInt();
          idManager.addConnection(choiceId, whenClauseId);

          addConnections(whenClauseId, whenDefinition.getOutputs(), idManager);
        });

        OtherwiseDefinition otherwise = choice.getOtherwise();
        String otherwiseId = "otherwise-"+ random.nextInt();

        idManager.addConnection(choiceId, otherwiseId);
        addConnections(otherwiseId, otherwise.getOutputs(), idManager);
      }else if(out instanceof TryDefinition){
        TryDefinition tryDefinition = (TryDefinition) out;
        String tryId = tryDefinition.toString() + random.nextInt();
        idManager.addConnection(normalizedName(in), tryId);

        addConnections(tryId, tryDefinition.getOutputs(), idManager);
        addConnections(tryId, tryDefinition.getOutputsWithoutCatches(), idManager);

//        addConnections(tryId, tryDefinition.getCatchClauses().stream().map(it-> (ProcessorDefinition)it).collect(Collectors.toList()), idManager);
      } else {
        idManager.addConnection( normalizedName(in), normalizedName(out));
        addConnections(normalizedName(out), out.getOutputs(), idManager);
      }
    });
  }

}

class IdManager {
  class Edge {
    Integer source, target;
    public Edge(Integer source, Integer target) {
      this.source = source;
      this.target = target;
    }
  }

  private Map<String,Integer> labelToId = new HashMap<>();
  private int id = 0;
  private Map<Integer,String> idToLabel = new HashMap<>();

  private List<String> connectionStrings = new ArrayList<>();

  private Integer add(String s){
    if(labelToId.containsKey(s)) return labelToId.get(s);

    int i = id;
    labelToId.put(s, i);
    idToLabel.put(i,s);
    id++;
    return i;
  }

  private Integer idFor(String s){ return labelToId.get(s); }
  private String labelFor(Integer id){ return idToLabel.get(id); }

  private String labelFor(String id){ return idToLabel.get(Integer.parseInt(id)); }

  private Map<Integer, Integer> connections = new HashMap<>();

  public void addConnection(String s, String t){
    connectionStrings.add(add(s)+ ":" + add(t));
  }

  public void printConnections(){
    Set<Integer> nodes = new HashSet<>();

    List<String> edges = connectionStrings.stream().map(it -> {
      String[] split = it.split(":");
      int src = Integer.parseInt(split[0]), target = Integer.parseInt(split[1]);
      nodes.add(src);
      nodes.add(target);
      return "{ from: " + src + ", to: " + target + ", arrows: 'to' }";
    }).collect(Collectors.toList());

    List<String> nodesJson = nodes.stream().map(i -> "{ id: " + i + ", label: '" + labelFor(i) + "' }").collect(Collectors.toList());

    System.out.println("[ "+join(",", nodesJson)+" ]");
    System.out.println("["+ join(",", edges)+" ]");
  }

}
