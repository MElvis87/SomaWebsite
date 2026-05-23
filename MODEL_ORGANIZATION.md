# Soma 3D Model Organization

Use the existing accordion structure for topics and subtopics. The shared files added in `assets/css/soma-modern.css` and `assets/js/soma-model-organizer.js` keep nested subtopic accordions the same usable width as their parent panels.

## Quick model embed

Inside any topic or subtopic body, add this single container and change the title/source:

```html
<div class="model-container"
     data-model-title="Human Heart"
     data-model-src="https://sketchfab.com/models/168b474fba564f688048212e99b4159d/embed"
     data-model-link="https://sketchfab.com/3d-models/3d-animated-realistic-human-heart-v20-168b474fba564f688048212e99b4159d">
</div>
```

The helper script turns that into the same responsive Sketchfab wrapper used across the site.

## Multiple models in one topic

```html
<div class="model-grid model-grid-3">
    <div class="model-container" data-model-title="Model One" data-model-src="https://sketchfab.com/models/MODEL_ID/embed"></div>
    <div class="model-container" data-model-title="Model Two" data-model-src="https://sketchfab.com/models/MODEL_ID/embed"></div>
    <div class="model-container" data-model-title="Model Three" data-model-src="https://sketchfab.com/models/MODEL_ID/embed"></div>
</div>
```

## Subtopics

For nested subtopics, keep using a direct card inside the parent `.accordion-body`:

```html
<div class="card my-4">
    <div class="accordion accordion-flush" id="uniqueSubtopicAccordion">
        <!-- subtopic accordion items -->
    </div>
</div>
```

Give every accordion heading and collapse panel a unique ID. The modern CSS and JS will make that subtopic card span the full parent width automatically.