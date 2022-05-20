function makeLinksOpenInNewTab() {
  document.querySelectorAll('a').forEach((e,i) => {
     e.setAttribute('target', '_blank');
  })
}

function renderAccordions() {
  console.log('Rendering accordions')

  var acc = document.getElementsByClassName("accordion");
  var i;

  for (i = 0; i < acc.length; i++) {
    if(acc[i].dataset.accordion_rendered === "true") continue;

    acc[i].addEventListener("click", function() {
      /* Toggle between adding and removing the "active" class,
      to highlight the button that controls the panel */
      this.classList.toggle("active");

      /* Toggle between hiding and showing the active panel */
      var panel = this.nextElementSibling;
      if (panel.style.display === "block") {
        panel.style.display = "none";
      } else {
        panel.style.display = "block";
      }
    });
  }
}

window.transformers = [makeLinksOpenInNewTab, renderAccordions]
