/* Soma model organization helper.
   Add a model with:
   <div class="model-container" data-model-title="Human Heart" data-model-src="https://sketchfab.com/models/MODEL_ID/embed"></div>
*/
(function(){
  "use strict";
  var modelAllow="autoplay; fullscreen; xr-spatial-tracking";
  function onReady(callback){if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",callback);return;}callback();}
  function classifyPage(){
    if(document.getElementById("topicsAccordion")){document.body.classList.add("subject-page");}
    if(document.querySelector(".hero-section-redesigned")){document.body.classList.add("home-page");}
    if(document.querySelector(".auth-section")){document.body.classList.add("auth-page");}
  }
  function decorateSubtopics(){
    document.querySelectorAll("#topicsAccordion .accordion .accordion").forEach(function(accordion){
      accordion.classList.add("subtopic-accordion");
      var panel=accordion.closest(".card");
      if(panel&&panel.closest(".accordion-body")){panel.classList.add("subtopic-panel");}
    });
    document.querySelectorAll("#topicsAccordion .accordion-body > .card").forEach(function(card){
      if(card.querySelector(".accordion")){card.classList.add("subtopic-panel");}
    });
  }
  function resolveModelSource(host){
    var src=host.getAttribute("data-model-src")||"";
    var id=host.getAttribute("data-model-id")||"";
    if(!src&&id){src="https://sketchfab.com/models/"+id+"/embed";}
    return src.trim();
  }
  function buildModel(model){
    var wrapper=document.createElement("div");
    wrapper.className="sketchfab-embed-wrapper";
    var frameBox=document.createElement("div");
    frameBox.className="responsive-iframe-container";
    var iframe=document.createElement("iframe");
    iframe.title=model.title||"Interactive 3D model";
    iframe.src=model.src;
    iframe.loading="lazy";
    iframe.frameBorder="0";
    iframe.allowFullscreen=true;
    iframe.setAttribute("mozallowfullscreen","true");
    iframe.setAttribute("webkitallowfullscreen","true");
    iframe.setAttribute("allow",model.allow||modelAllow);
    iframe.setAttribute("referrerpolicy","strict-origin-when-cross-origin");
    frameBox.appendChild(iframe);
    wrapper.appendChild(frameBox);
    if(model.title||model.link||model.provider){
      var caption=document.createElement("p");
      var link=document.createElement("a");
      link.href=model.link||model.src.replace(/\/embed(?:\?.*)?$/,"");
      link.target="_blank";
      link.rel="nofollow noopener";
      link.textContent=model.title||"3D model";
      caption.appendChild(link);
      caption.appendChild(document.createTextNode(" on "+(model.provider||"Sketchfab")));
      wrapper.appendChild(caption);
    }
    return wrapper;
  }
  function mountModel(host,model){
    var dataModel=model||{
      src:resolveModelSource(host),
      title:host.getAttribute("data-model-title")||host.getAttribute("aria-label")||"Interactive 3D model",
      link:host.getAttribute("data-model-link")||"",
      provider:host.getAttribute("data-model-provider")||"Sketchfab",
      allow:host.getAttribute("data-model-allow")||modelAllow
    };
    if(!dataModel.src){return null;}
    host.innerHTML="";
    host.appendChild(buildModel(dataModel));
    host.classList.add("model-ready");
    host.setAttribute("data-model-ready","true");
    return host;
  }
  function mountAll(root){
    var scope=root||document;
    var hosts=scope.querySelectorAll(".model-container[data-model-src], .model-container[data-model-id], [data-soma-model][data-model-src], [data-soma-model][data-model-id]");
    hosts.forEach(function(host){if(host.getAttribute("data-model-ready")!=="true"){mountModel(host);}});
  }
  function normalizeExistingModels(){
    document.querySelectorAll(".model-container iframe, .sketchfab-embed-wrapper iframe").forEach(function(iframe){
      if(!iframe.getAttribute("title")){iframe.setAttribute("title","Interactive 3D model");}
      iframe.setAttribute("loading","lazy");
      iframe.setAttribute("allow",iframe.getAttribute("allow")||modelAllow);
      iframe.setAttribute("referrerpolicy","strict-origin-when-cross-origin");
      var src=iframe.getAttribute("src")||"";
      var modelContainer=iframe.closest(".model-container");
      if(modelContainer&&(src.indexOf("YOUR_")!==-1||src.indexOf("MODEL_URL_HERE")!==-1)){modelContainer.classList.add("needs-model-src");}
      if(!iframe.closest(".responsive-iframe-container")){
        var frameBox=document.createElement("div");
        frameBox.className="responsive-iframe-container";
        iframe.parentNode.insertBefore(frameBox,iframe);
        frameBox.appendChild(iframe);
      }
    });
    document.querySelectorAll(".responsive-iframe-container").forEach(function(slot){
      if(!slot.querySelector("iframe, object, embed, model-viewer")&&slot.textContent.trim()===""){slot.classList.add("is-empty-model-slot");}
    });
  }
  window.SomaModels={build:buildModel,mount:mountModel,mountAll:mountAll};
  onReady(function(){classifyPage();decorateSubtopics();mountAll(document);normalizeExistingModels();});
}());