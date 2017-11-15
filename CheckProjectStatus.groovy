import groovy.json.JsonSlurper
import groovy.transform.Field
import groovy.xml.DOMBuilder
import groovy.xml.XmlUtil
import groovy.xml.dom.DOMCategory

import java.nio.file.Files

@Field
def uiProjects = []

@Field
def javaProjects = [ "order-execution-service", "price-discovery-service", "reference-data-service", "services-common"]

@Field
def baseDir = "C:/Dev/AMExecution"

@Field
def uiProjectsDir = new File(baseDir, "UI-code")
if(!uiProjectsDir.exists()) uiProjectsDir.mkdirs()

@Field
def javaPojectsDir = new File(baseDir, "API-Code")
if(!javaPojectsDir.exists()) javaPojectsDir.mkdirs()

@Field
String username = System.properties['user.name']

@Field
def localhost = InetAddress.getLocalHost().getHostName().toLowerCase();

@Field
def propertyFile = { file ->
    def props = new Properties()
    props.load( new FileInputStream(file))
    return props
}

@Field
def checkPropertyFile = { file, validation, validationCriteria ->
    def propValues = propertyFile( file)

    if(validation(propValues) == false){
        println "Failed for file $file  $validationCriteria"
    }
}

@Field
def checkJsonFile = { file, validation, msg ->
    def json = new JsonSlurper().parse(file)
    if(validation(json) == false)  println "Failed for file $file $msg"
}

def verifyProjectStatus(){
    def _ = { String directory,String filename -> return new File(javaPojectsDir.absolutePath + directory, filename) }

    def filesRequired = []
    filesRequired << ["caplin-multideal", "caplin-ratepad", "caplin-rfqv2", "caplin-icr", "caplin"]
            .collect { _("/order-execution-service/src/main/resources/config/$it/local", "datasource-${localhost}.properties") }

    filesRequired.flatten().each{ if(!it.exists()){ println "File $it does not exist."} }

    def props = propertyFile( _("/order-execution-service/src/main/resources/config/local", "am-fix-adapter.properties"))
    if( props["fix.compid.sender.${localhost}.fm.rbsgrp.net"] == null){ println "Your system is not configured for FIX sending. ${_("/order-execution-service/src/main/resources/config/local", "am-fix-adapter.properties")} is missing"}

    props = propertyFile( _("/order-execution-service/src/main/resources/config", "ame-tradefx.properties"))
    def iceServer = props["rfqservice.ice.address"]
    //Check ice server is connecting

    def containsFixCompIdSender = { it["fix.compid.sender"].contains("${localhost}.fm.rbsgrp.net") }
    def containsFixRestingCompIdSender = { it["fix.resting.compid.sender"].contains("${localhost}.fm.rbsgrp.net") }

    checkPropertyFile _("/order-execution-service/src/main/resources/config/spring/local/ldn", "fix-spring.properties"),
            containsFixCompIdSender, "Missing $localhost in fix.compid.sender"
    checkPropertyFile _("/order-execution-service/src/main/resources/config/spring/local/ldn", "fix-spring.properties"),
            containsFixRestingCompIdSender, "Missing $localhost in fix.resting.compid.sender"

    checkPropertyFile _("/services-common/services-common-fix/src/main/resources/config/spring/local/ldn", "fix-spring.properties"),
            containsFixCompIdSender, "Missing $localhost in fix.compid.sender"
    checkPropertyFile _("/services-common/services-common-fix/src/main/resources/config/spring/local/ldn", "fix-spring.properties"),
            containsFixRestingCompIdSender, "Missing $localhost in fix.resting.compid.sender"

    def containsStreamlink = { it.default.find { it.find { it.contains(localhost)} } || it.default.find { it.find { it.contains('localhost')} } }

    checkJsonFile _( "/reference-data-service/src/main/webapp/caplin/local/ldn", "streamlink.json"), containsStreamlink, "Missing $localhost in streamlink"

    checkJsonFile _( "/reference-data-service/src/main/webapp/WEB-INF/caplin/local/ldn", "streamlink.json"), containsStreamlink, "Missing $localhost in streamlink"

    def canConnectToCaplin = { it.default.find{ } }
    checkJsonFile _( "/reference-data-service/src/main/webapp/WEB-INF/caplin/local/ldn", "streamlink.json"), canConnectToCaplin , "Cant connect to caplin. "
}

def modifyXml(xml, closure) {
    def document = DOMBuilder.parse(new StringReader(xml))
    def root = document.documentElement

    use(DOMCategory) {
        // manipulate the XML here, i.e. root.someElement?.each { it.value = 'new value'}
        closure(root)
    }

    XmlUtil.serialize(root)
}

def modifyAndSaveXmlFile(file, closure = { it }) {
    if (!File.isCase(file)) file = new File(file)

    if (!file.exists()) return
    def result = modifyXml(file.text, closure)

//    file.withWriter { w -> w.write(result) }
}

@Field
def calculateVersions = null

calculateVersions = { pomFile, versions ->
    def pom = new XmlSlurper().parse(pomFile)
    versions[pom.'artifactId'.toString()] = pom.version.toString()
    if(!versions[pom.'artifactId'.toString()]) versions[pom.'artifactId'.toString()] = pom.parent.version.toString()

    pom.modules.module.each{ moduleName ->
        calculateVersions new File( new File(pomFile.parentFile, moduleName.toString()), "pom.xml"), versions
    }
}

def synchronizeProjectVersions(){
    def versions = [:]
    javaProjects.collect {new File(javaPojectsDir.absolutePath, it.toString())}.findAll { it.exists()}.each { project ->
        calculateVersions new File(project, "pom.xml"), versions
    }

    def slurper = new XmlSlurper()

    javaProjects.collect {new File(javaPojectsDir.absolutePath, it)}.findAll { it.exists()}.each { project ->
        def pomFile = new File(project, "pom.xml")

        def properties = slurper.parse(pomFile).'properties'.'*'.collectEntries { [ (it.name()) : it.text() ] }

        def resolveVersion = { versionKey ->
            if(! versionKey?.startsWith('$')) return versionKey
            def key = ( versionKey =~ /\$\{(.*)}/ ).find{ true }?.getAt(1)
            return properties[key]
        }

        def processDependencies = { dependencies ->
            dependencies.dependency.each { dep ->
                String artifactId = dep.artifactId?.getAt(0)?.text()
                String version = resolveVersion( dep.version?.getAt(0)?.text().toString().trim())

                if(version != null && version != 'null' && versions.containsKey( artifactId) && !version?.equals(versions[artifactId])){
//                    dep.version[0]?.value = versions[artifactId]
//                    fileChanged = true
                    System.err.println "Project: ${project.absolutePath + File.separator + "pom.xml"} Dependency: ${artifactId} is not in synch. Latest is ${versions[artifactId]}"
                }
            }
        }

        modifyAndSaveXmlFile(pomFile, { pomXml ->
            boolean fileChanged = false
            processDependencies(pomXml.'dependencies')
            processDependencies(pomXml.'dependencyManagement'.dependencies)
        })
    }
}

synchronizeProjectVersions()
verifyProjectStatus()
