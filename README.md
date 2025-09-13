# echavi - Enhanced OSM Change Viewer

echavi is a [Leaflet](https://leafletjs.com/)-based reimplementation of [achavi](https://github.com/nrenner/achavi), the Augmented OSM Change Viewer, with some improvements and modern enhancements.

https://echavi.github.io/echavi/

## Bookmarklet

Easily open a changeset in echavi from the OSM website:

1. Create a new bookmark in your browser.
2. Copy the following code and set it as the bookmark's URL:

```javascript
javascript:(function() {
    const href = window.location.href;
    let changesetId = null;
    let match = href.match(/changeset\/(\d+)/);
    if (match) {
        changesetId = match[1];
    } else {
        match = href.match(/[?&]changeset=(\d+)/);
        if (match) {
            changesetId = match[1];
        } else {
            match = href.match(/changesets\/(\d+)/);
            if (match) changesetId = match[1];
        }
    }
    if (!changesetId) { alert('No changeset ID found.'); return; }
    const url = `https://echavi.github.io/echavi/?changeset=${changesetId}`;
    window.open(url, '_blank');
})();
```

3. Go to any OSM changeset page and click the bookmark to open it in echavi.
