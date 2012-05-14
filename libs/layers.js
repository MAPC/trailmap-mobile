// based on https://github.com/Citytracking/maps.stamen.com/blob/master/js/tile.stamen.js

(function() {

var SUBDOMAINS = [""],
    PROVIDERS =  {
        "basemap": {
            "url": "http://{S}tiles.mapc.org.s3-website-us-east-1.amazonaws.com/basemap/{Z}/{X}/{Y}.png",
            "minZoom": 9,
            "maxZoom": 17
        },
        "trailmap": {
            "url": "http://{S}tiles.mapc.org.s3-website-us-east-1.amazonaws.com/trailmap/{Z}/{X}/{Y}.png",
            "minZoom": 9,
            "maxZoom": 17
        }
    },
    ATTRIBUTION = 'Map tiles by <a href="http://mapc.org">MAPC</a>, ' +
        'Data by <a href="http://www.mass.gov/mgis/">MassGIS</a>.';

function getProvider(name) {
    if (name in PROVIDERS) {
        return PROVIDERS[name];
    } else {
        throw 'No such provider: "' + name + '"';
    }
}

if (typeof MM === "object") {
    MM.MAPCTileLayer = function(name) {
        var provider = getProvider(name);
        MM.Layer.call(this, new MM.TemplatedMapProvider(provider.url, SUBDOMAINS));
        this.provider.setZoomRange(provider.minZoom, provider.maxZoom);
        this.attribution = ATTRIBUTION;
    };
    MM.extend(MM.MAPCTileLayer, MM.Layer);
}

if (typeof L === "object") {
    L.MAPCTileLayer = L.TileLayer.extend({
        initialize: function(name) {
            var provider = getProvider(name),
                url = provider.url.toLowerCase();
            L.TileLayer.prototype.initialize.call(this, url, {
                "minZoom":      provider.minZoom,
                "maxZoom":      provider.maxZoom,
                "subdomains":   SUBDOMAINS,
                "scheme":       "xyz",
                "attribution":  ATTRIBUTION
            });
        }
    });
}

if (typeof OpenLayers === "object") {
    // make a tile URL template OpenLayers-compatible
    function openlayerize(url) {
        return url.replace(/({.})/g, function(v) {
            return "$" + v.toLowerCase();
        });
    }

    // based on http://www.bostongis.com/PrinterFriendly.aspx?content_name=using_custom_osm_tiles
    OpenLayers.Layer.MAPC = OpenLayers.Class(OpenLayers.Layer.OSM, {
        initialize: function(name, options) {
            var provider = getProvider(name),
                url = provider.url,
                hosts = [];
            if (url.indexOf("{S}") > -1) {
                for (var i = 0; i < SUBDOMAINS.length; i++) {
                    hosts.push(openlayerize(url.replace("{S}", SUBDOMAINS[i])));
                }
            } else {
                hosts.push(openlayerize(url));
            }
            options = OpenLayers.Util.extend({
                "numZoomLevels":    provider.maxZoom,
                "buffer":           0,
                "transitionEffect": "resize"
            }, options);
            return OpenLayers.Layer.OSM.prototype.initialize.call(this, name, hosts, options);
        }
    });
}

if (typeof google === "object" && typeof google.maps === "object") {
    google.maps.MAPCMapType = function(name) {
        var provider = getProvider(name);
        return google.maps.ImageMapType.call(this, {
            "getTileUrl": function(coord, zoom) {
                var index = (zoom + coord.x + coord.y) % SUBDOMAINS.length;
                return [
                    provider.url
                        .replace("{S}", SUBDOMAINS[index])
                        .replace("{Z}", zoom)
                        .replace("{X}", coord.x)
                        .replace("{Y}", coord.y)
                ];
            },
            "tileSize": new google.maps.Size(256, 256),
            "name":     name,
            "minZoom":  provider.minZoom,
            "maxZoom":  provider.maxZoom
        });
    };
    // FIXME: is there a better way to extend classes in Google land?
    google.maps.MAPCMapType.prototype = new google.maps.ImageMapType("_");
}

})();

