var PruneCluster,__extends=this&&this.__extends||function(){var t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var r in e)e.hasOwnProperty(r)&&(t[r]=e[r])};return function(e,r){function a(){this.constructor=e}t(e,r),e.prototype=null===r?Object.create(r):(a.prototype=r.prototype,new a)}}();!function(t){t.Point=function(){};var e=function(){};t.ClusterObject=e;var r=1,a=Math.pow(2,53)-1,o=function(t){function e(e,a,o,i,s,n){void 0===o&&(o={}),void 0===s&&(s=1),void 0===n&&(n=!1);var l=t.call(this)||this;return l.data=o,l.position={lat:+e,lng:+a},l.weight=s,l.category=i,l.filtered=n,l.hashCode=r++,l}return __extends(e,t),e.prototype.Move=function(t,e){this.position.lat=+t,this.position.lng=+e},e.prototype.SetData=function(t){for(var e in t)this.data[e]=t[e]},e}(e);t.Marker=o;var i=function(t){function e(r){var a=t.call(this)||this;return a.stats=[0,0,0,0,0,0,0,0],a.data={},r?(e.ENABLE_MARKERS_LIST&&(a._clusterMarkers=[r]),a.lastMarker=r,a.hashCode=31+r.hashCode,a.population=1,void 0!==r.category&&(a.stats[r.category]=1),a.totalWeight=r.weight,a.position={lat:r.position.lat,lng:r.position.lng},a.averagePosition={lat:r.position.lat,lng:r.position.lng},a):(a.hashCode=1,e.ENABLE_MARKERS_LIST&&(a._clusterMarkers=[]),a)}return __extends(e,t),e.prototype.AddMarker=function(t){e.ENABLE_MARKERS_LIST&&this._clusterMarkers.push(t);var r=this.hashCode;r=(r<<5)-r+t.hashCode,this.hashCode=r>=a?r%a:r,this.lastMarker=t;var o=t.weight,i=this.totalWeight,s=o+i;this.averagePosition.lat=(this.averagePosition.lat*i+t.position.lat*o)/s,this.averagePosition.lng=(this.averagePosition.lng*i+t.position.lng*o)/s,++this.population,this.totalWeight=s,void 0!==t.category&&(this.stats[t.category]=this.stats[t.category]+1||1)},e.prototype.Reset=function(){this.hashCode=1,this.lastMarker=void 0,this.population=0,this.totalWeight=0,this.stats=[0,0,0,0,0,0,0,0],e.ENABLE_MARKERS_LIST&&(this._clusterMarkers=[])},e.prototype.ComputeBounds=function(t){var e=t.Project(this.position.lat,this.position.lng),r=t.Size,a=Math.floor(e.x/r)*r,o=Math.floor(e.y/r)*r,i=t.UnProject(a,o),s=t.UnProject(a+r,o+r);this.bounds={minLat:s.lat,maxLat:i.lat,minLng:i.lng,maxLng:s.lng}},e.prototype.GetClusterMarkers=function(){return this._clusterMarkers},e.prototype.ApplyCluster=function(t){this.hashCode=41*this.hashCode+43*t.hashCode,this.hashCode>a&&(this.hashCode=this.hashCode=a);var r=t.totalWeight,o=this.totalWeight,i=r+o;for(var s in this.averagePosition.lat=(this.averagePosition.lat*o+t.averagePosition.lat*r)/i,this.averagePosition.lng=(this.averagePosition.lng*o+t.averagePosition.lng*r)/i,this.population+=t.population,this.totalWeight=i,this.bounds.minLat=Math.min(this.bounds.minLat,t.bounds.minLat),this.bounds.minLng=Math.min(this.bounds.minLng,t.bounds.minLng),this.bounds.maxLat=Math.max(this.bounds.maxLat,t.bounds.maxLat),this.bounds.maxLng=Math.max(this.bounds.maxLng,t.bounds.maxLng),t.stats)t.stats.hasOwnProperty(s)&&(this.stats.hasOwnProperty(s)?this.stats[s]+=t.stats[s]:this.stats[s]=t.stats[s]);e.ENABLE_MARKERS_LIST&&(this._clusterMarkers=this._clusterMarkers.concat(t.GetClusterMarkers()))},e.ENABLE_MARKERS_LIST=!1,e}(e);function s(t){for(var e,r,a,o=1,i=t.length;o<i;++o){for(a=(r=t[o]).position.lng,e=o-1;e>=0&&t[e].position.lng>a;--e)t[e+1]=t[e];t[e+1]=r}}t.Cluster=i;var n=function(){function t(){this._markers=[],this._nbChanges=0,this._clusters=[],this.Size=166,this.ViewPadding=.2}return t.prototype.RegisterMarker=function(t){t._removeFlag&&delete t._removeFlag,this._markers.push(t),this._nbChanges+=1},t.prototype.RegisterMarkers=function(t){var e=this;t.forEach((function(t){e.RegisterMarker(t)}))},t.prototype._sortMarkers=function(){var t,e,r=this._markers,a=r.length;this._nbChanges&&(t=a,(e=this._nbChanges)>300||!(e/t<.2))?this._markers.sort((function(t,e){return t.position.lng-e.position.lng})):s(r),this._nbChanges=0},t.prototype._sortClusters=function(){s(this._clusters)},t.prototype._indexLowerBoundLng=function(t){for(var e,r,a=this._markers,o=0,i=a.length;i>0;)a[e=o+(r=Math.floor(i/2))].position.lng<t?(o=++e,i-=r+1):i=r;return o},t.prototype._resetClusterViews=function(){for(var t=0,e=this._clusters.length;t<e;++t){var r=this._clusters[t];r.Reset(),r.ComputeBounds(this)}},t.prototype.ProcessView=function(t){var e=Math.abs(t.maxLat-t.minLat)*this.ViewPadding,r=Math.abs(t.maxLng-t.minLng)*this.ViewPadding,a={minLat:t.minLat-e-e,maxLat:t.maxLat+e+e,minLng:t.minLng-r-r,maxLng:t.maxLng+r+r};this._sortMarkers(),this._resetClusterViews();for(var o,s,n=this._indexLowerBoundLng(a.minLng),l=this._markers,h=this._clusters,u=h.slice(0),p=n,d=l.length;p<d;++p){var m=l[p],f=m.position;if(f.lng>a.maxLng)break;if(f.lat>a.minLat&&f.lat<a.maxLat&&!m.filtered){for(var _,g=!1,c=0,L=u.length;c<L;++c)if((_=u[c]).bounds.maxLng<m.position.lng)u.splice(c,1),--c,--L;else if(o=f,s=_.bounds,o.lat>=s.minLat&&o.lat<=s.maxLat&&o.lng>=s.minLng&&o.lng<=s.maxLng){_.AddMarker(m),g=!0;break}g||((_=new i(m)).ComputeBounds(this),h.push(_),u.push(_))}}var v=[];for(p=0,d=h.length;p<d;++p)(_=h[p]).population>0&&v.push(_);return this._clusters=v,this._sortClusters(),this._clusters},t.prototype.RemoveMarkers=function(t){if(t){for(var e=0,r=t.length;e<r;++e)t[e]._removeFlag=!0;var a=[];for(e=0,r=this._markers.length;e<r;++e)this._markers[e]._removeFlag?delete this._markers[e]._removeFlag:a.push(this._markers[e]);this._markers=a}else this._markers=[]},t.prototype.FindMarkersInArea=function(t){for(var e=t.minLat,r=t.maxLat,a=t.minLng,o=t.maxLng,i=this._markers,s=[],n=this._indexLowerBoundLng(a),l=i.length;n<l;++n){var h=i[n].position;if(h.lng>o)break;h.lat>=e&&h.lat<=r&&h.lng>=a&&s.push(i[n])}return s},t.prototype.ComputeBounds=function(t,e){if(void 0===e&&(e=!0),!t||!t.length)return null;for(var r=Number.MAX_VALUE,a=-Number.MAX_VALUE,o=Number.MAX_VALUE,i=-Number.MAX_VALUE,s=0,n=t.length;s<n;++s)if(e||!t[s].filtered){var l=t[s].position;l.lat<r&&(r=l.lat),l.lat>a&&(a=l.lat),l.lng<o&&(o=l.lng),l.lng>i&&(i=l.lng)}return{minLat:r,maxLat:a,minLng:o,maxLng:i}},t.prototype.FindMarkersBoundsInArea=function(t){return this.ComputeBounds(this.FindMarkersInArea(t))},t.prototype.ComputeGlobalBounds=function(t){return void 0===t&&(t=!0),this.ComputeBounds(this._markers,t)},t.prototype.GetMarkers=function(){return this._markers},t.prototype.GetPopulation=function(){return this._markers.length},t.prototype.ResetClusters=function(){this._clusters=[]},t}();t.PruneCluster=n}(PruneCluster||(PruneCluster={})),PruneCluster||(PruneCluster={});var PruneClusterForLeaflet=(L.Layer?L.Layer:L.Class).extend({initialize:function(t,e){var r=this;void 0===t&&(t=120),void 0===e&&(e=20),this.Cluster=new PruneCluster.PruneCluster,this.Cluster.Size=t,this.clusterMargin=Math.min(e,t/4),this.Cluster.Project=function(t,e){return r._map.project(new L.LatLng(t,e),Math.floor(r._map.getZoom()))},this.Cluster.UnProject=function(t,e){return r._map.unproject(new L.Point(t,e),Math.floor(r._map.getZoom()))},this._objectsOnMap=[],this.spiderfier=new PruneClusterLeafletSpiderfier(this),this._hardMove=!1,this._resetIcons=!1,this._removeTimeoutId=0,this._markersRemoveListTimeout=[]},RegisterMarker:function(t){this.Cluster.RegisterMarker(t)},RegisterMarkers:function(t){this.Cluster.RegisterMarkers(t)},RemoveMarkers:function(t){this.Cluster.RemoveMarkers(t)},BuildLeafletCluster:function(t,e){var r=this,a=new L.Marker(e,{icon:this.BuildLeafletClusterIcon(t)});return a._leafletClusterBounds=t.bounds,a.on("click",(function(){var t=a._leafletClusterBounds,e=r.Cluster.FindMarkersInArea(t),o=r.Cluster.ComputeBounds(e);if(o){var i=new L.LatLngBounds(new L.LatLng(o.minLat,o.maxLng),new L.LatLng(o.maxLat,o.minLng)),s=r._map.getZoom(),n=r._map.getBoundsZoom(i,!1,new L.Point(20,20));if(n===s){for(var l=[],h=0,u=r._objectsOnMap.length;h<u;++h){var p=r._objectsOnMap[h];p.data._leafletMarker!==a&&p.bounds.minLat>=t.minLat&&p.bounds.maxLat<=t.maxLat&&p.bounds.minLng>=t.minLng&&p.bounds.maxLng<=t.maxLng&&l.push(p.bounds)}if(l.length>0){var d=[],m=l.length;for(h=0,u=e.length;h<u;++h){for(var f=e[h].position,_=!1,g=0;g<m;++g){var c=l[g];if(f.lat>=c.minLat&&f.lat<=c.maxLat&&f.lng>=c.minLng&&f.lng<=c.maxLng){_=!0;break}}_||d.push(e[h])}e=d}e.length<200||n>=r._map.getMaxZoom()?r._map.fire("overlappingmarkers",{cluster:r,markers:e,center:a.getLatLng(),marker:a}):n++,r._map.setView(a.getLatLng(),n)}else r._map.fitBounds(i)}})),a},BuildLeafletClusterIcon:function(t){var e="prunecluster prunecluster-",r=38,a=this.Cluster.GetPopulation();return t.population<Math.max(10,.01*a)?e+="small":t.population<Math.max(100,.05*a)?(e+="medium",r=40):(e+="large",r=44),new L.DivIcon({html:"<div><span>"+t.population+"</span></div>",className:e,iconSize:L.point(r,r)})},BuildLeafletMarker:function(t,e){var r=new L.Marker(e);return this.PrepareLeafletMarker(r,t.data,t.category),r},PrepareLeafletMarker:function(t,e,r){if(e.icon&&("function"==typeof e.icon?t.setIcon(e.icon(e,r)):t.setIcon(e.icon)),e.popup){var a="function"==typeof e.popup?e.popup(e,r):e.popup;t.getPopup()?t.setPopupContent(a,e.popupOptions):t.bindPopup(a,e.popupOptions)}},onAdd:function(t){this._map=t,t.on("movestart",this._moveStart,this),t.on("moveend",this._moveEnd,this),t.on("zoomend",this._zoomStart,this),t.on("zoomend",this._zoomEnd,this),this.ProcessView(),t.addLayer(this.spiderfier)},onRemove:function(t){t.off("movestart",this._moveStart,this),t.off("moveend",this._moveEnd,this),t.off("zoomend",this._zoomStart,this),t.off("zoomend",this._zoomEnd,this);for(var e=0,r=this._objectsOnMap.length;e<r;++e)t.removeLayer(this._objectsOnMap[e].data._leafletMarker);this._objectsOnMap=[],this.Cluster.ResetClusters(),t.removeLayer(this.spiderfier),this._map=null},_moveStart:function(){this._moveInProgress=!0},_moveEnd:function(t){this._moveInProgress=!1,this._hardMove=t.hard,this.ProcessView()},_zoomStart:function(){this._zoomInProgress=!0},_zoomEnd:function(){this._zoomInProgress=!1,this.ProcessView()},ProcessView:function(){var t=this;if(this._map&&!this._zoomInProgress&&!this._moveInProgress){for(var e=this._map,r=e.getBounds(),a=Math.floor(e.getZoom()),o=this.clusterMargin/this.Cluster.Size,i=this._resetIcons,s=r.getSouthWest(),n=r.getNorthEast(),l=this.Cluster.ProcessView({minLat:s.lat,minLng:s.lng,maxLat:n.lat,maxLng:n.lng}),h=this._objectsOnMap,u=[],p=new Array(h.length),d=0,m=h.length;d<m;++d){var f=h[d].data._leafletMarker;p[d]=f,f._removeFromMap=!0}var _=[],g=[],c=[],v=[];for(d=0,m=l.length;d<m;++d){for(var M=l[d],k=M.data,C=(M.bounds.maxLat-M.bounds.minLat)*o,P=(M.bounds.maxLng-M.bounds.minLng)*o,y=0,w=v.length;y<w;++y){var b=v[y];if(b.bounds.maxLng<M.bounds.minLng)v.splice(y,1),--y,--w;else{var x=b.averagePosition.lng+P,I=b.averagePosition.lat-C,S=b.averagePosition.lat+C,B=M.averagePosition.lng-P,R=M.averagePosition.lat-C,O=M.averagePosition.lat+C;if(x>B&&S>R&&I<O){k._leafletCollision=!0,b.ApplyCluster(M);break}}}k._leafletCollision||v.push(M)}for(l.forEach((function(e){var r=void 0,o=e.data;if(o._leafletCollision)return o._leafletCollision=!1,o._leafletOldPopulation=0,void(o._leafletOldHashCode=0);var s=new L.LatLng(e.averagePosition.lat,e.averagePosition.lng),n=o._leafletMarker;if(n)if(1===e.population&&1===o._leafletOldPopulation&&e.hashCode===n._hashCode)(i||n._zoomLevel!==a||e.lastMarker.data.forceIconRedraw)&&(t.PrepareLeafletMarker(n,e.lastMarker.data,e.lastMarker.category),e.lastMarker.data.forceIconRedraw&&(e.lastMarker.data.forceIconRedraw=!1)),n.setLatLng(s),r=n;else if(e.population>1&&o._leafletOldPopulation>1&&(n._zoomLevel===a||o._leafletPosition.equals(s))){if(n.setLatLng(s),i||e.population!=o._leafletOldPopulation||e.hashCode!==o._leafletOldHashCode){var l={};L.Util.extend(l,e.bounds),n._leafletClusterBounds=l,n.setIcon(t.BuildLeafletClusterIcon(e))}o._leafletOldPopulation=e.population,o._leafletOldHashCode=e.hashCode,r=n}r?(r._removeFromMap=!1,u.push(e),r._zoomLevel=a,r._hashCode=e.hashCode,r._population=e.population,o._leafletMarker=r,o._leafletPosition=s):(1===e.population?g.push(e):_.push(e),o._leafletPosition=s,o._leafletOldPopulation=e.population,o._leafletOldHashCode=e.hashCode)})),_=g.concat(_),d=0,m=h.length;d<m;++d){var A=(M=h[d]).data;if(f=A._leafletMarker,A._leafletMarker._removeFromMap){var E=!0;if(f._zoomLevel===a){var z=M.averagePosition;for(C=(M.bounds.maxLat-M.bounds.minLat)*o,P=(M.bounds.maxLng-M.bounds.minLng)*o,y=0,w=_.length;y<w;++y){var T=_[y],F=T.data;if(1===f._population&&1===T.population&&f._hashCode===T.hashCode)(i||T.lastMarker.data.forceIconRedraw)&&(this.PrepareLeafletMarker(f,T.lastMarker.data,T.lastMarker.category),T.lastMarker.data.forceIconRedraw&&(T.lastMarker.data.forceIconRedraw=!1)),f.setLatLng(F._leafletPosition),E=!1;else{var j=T.averagePosition,U=z.lng-P,V=j.lng+P;if(x=z.lng+P,I=z.lat-C,S=z.lat+C,B=j.lng-P,R=j.lat-C,O=j.lat+C,f._population>1&&T.population>1&&x>B&&U<V&&S>R&&I<O){f.setLatLng(F._leafletPosition),f.setIcon(this.BuildLeafletClusterIcon(T));var N={};L.Util.extend(N,T.bounds),f._leafletClusterBounds=N,F._leafletOldPopulation=T.population,F._leafletOldHashCode=T.hashCode,f._population=T.population,E=!1}}if(!E){F._leafletMarker=f,f._removeFromMap=!1,u.push(T),_.splice(y,1),--y,--w;break}}}E&&(f._removeFromMap||console.error("wtf"))}}for(d=0,m=_.length;d<m;++d){var D,G=(A=(M=_[d]).data)._leafletPosition;(D=1===M.population?this.BuildLeafletMarker(M.lastMarker,G):this.BuildLeafletCluster(M,G)).addTo(e),D.setOpacity(0),c.push(D),A._leafletMarker=D,D._zoomLevel=a,D._hashCode=M.hashCode,D._population=M.population,u.push(M)}if(window.setTimeout((function(){for(d=0,m=c.length;d<m;++d){var t=c[d];t._icon&&L.DomUtil.addClass(t._icon,"prunecluster-anim"),t._shadow&&L.DomUtil.addClass(t._shadow,"prunecluster-anim"),t.setOpacity(1)}}),1),this._hardMove)for(d=0,m=p.length;d<m;++d)(f=p[d])._removeFromMap&&e.removeLayer(f);else{if(0!==this._removeTimeoutId)for(window.clearTimeout(this._removeTimeoutId),d=0,m=this._markersRemoveListTimeout.length;d<m;++d)e.removeLayer(this._markersRemoveListTimeout[d]);var W=[];for(d=0,m=p.length;d<m;++d)(f=p[d])._removeFromMap&&(f.setOpacity(0),W.push(f));W.length>0&&(this._removeTimeoutId=window.setTimeout((function(){for(d=0,m=W.length;d<m;++d)e.removeLayer(W[d]);t._removeTimeoutId=0}),300)),this._markersRemoveListTimeout=W}this._objectsOnMap=u,this._hardMove=!1,this._resetIcons=!1}},FitBounds:function(t){void 0===t&&(t=!0);var e=this.Cluster.ComputeGlobalBounds(t);e&&this._map.fitBounds(new L.LatLngBounds(new L.LatLng(e.minLat,e.maxLng),new L.LatLng(e.maxLat,e.minLng)))},GetMarkers:function(){return this.Cluster.GetMarkers()},RedrawIcons:function(t){void 0===t&&(t=!0),this._resetIcons=!0,t&&this.ProcessView()}}),PruneClusterLeafletSpiderfier=(L.Layer?L.Layer:L.Class).extend({_2PI:2*Math.PI,_circleFootSeparation:25,_circleStartAngle:Math.PI/6,_spiralFootSeparation:28,_spiralLengthStart:11,_spiralLengthFactor:5,_spiralCountTrigger:8,spiderfyDistanceMultiplier:1,initialize:function(t){this._cluster=t,this._currentMarkers=[],this._multiLines=!!L.multiPolyline,this._lines=this._multiLines?L.multiPolyline([],{weight:1.5,color:"#222"}):L.polyline([],{weight:1.5,color:"#222"})},onAdd:function(t){this._map=t,this._map.on("overlappingmarkers",this.Spiderfy,this),this._map.on("click",this.Unspiderfy,this),this._map.on("zoomend",this.Unspiderfy,this)},Spiderfy:function(t){var e=this;if(t.cluster===this._cluster){this.Unspiderfy();var r=t.markers.filter((function(t){return!t.filtered}));this._currentCenter=t.center;var a,o=this._map.latLngToLayerPoint(t.center);r.length>=this._spiralCountTrigger?a=this._generatePointsSpiral(r.length,o):(this._multiLines&&(o.y+=10),a=this._generatePointsCircle(r.length,o));for(var i=[],s=[],n=[],l=0,h=a.length;l<h;++l){var u=this._map.layerPointToLatLng(a[l]),p=this._cluster.BuildLeafletMarker(r[l],t.center);p.setZIndexOffset(5e3),p.setOpacity(0),this._currentMarkers.push(p),this._map.addLayer(p),s.push(p),n.push(u)}window.setTimeout((function(){for(l=0,h=a.length;l<h;++l)s[l].setLatLng(n[l]).setOpacity(1);var r=+new Date,o=window.setInterval((function(){i=[];var s=+new Date-r;if(s>=290)window.clearInterval(o),u=1;else var u=s/290;var p=t.center;for(l=0,h=a.length;l<h;++l){var d=n[l],m=d.lat-p.lat,f=d.lng-p.lng;i.push([p,new L.LatLng(p.lat+m*u,p.lng+f*u)])}e._lines.setLatLngs(i)}),42)}),1),this._lines.setLatLngs(i),this._map.addLayer(this._lines),t.marker&&(this._clusterMarker=t.marker.setOpacity(.3))}},_generatePointsCircle:function(t,e){var r,a,o=this.spiderfyDistanceMultiplier*this._circleFootSeparation*(2+t)/this._2PI,i=this._2PI/t,s=[];for(s.length=t,r=t-1;r>=0;r--)a=this._circleStartAngle+r*i,s[r]=new L.Point(Math.round(e.x+o*Math.cos(a)),Math.round(e.y+o*Math.sin(a)));return s},_generatePointsSpiral:function(t,e){var r,a=this.spiderfyDistanceMultiplier*this._spiralLengthStart,o=this.spiderfyDistanceMultiplier*this._spiralFootSeparation,i=this.spiderfyDistanceMultiplier*this._spiralLengthFactor,s=0,n=[];for(n.length=t,r=t-1;r>=0;r--)s+=o/a+5e-4*r,n[r]=new L.Point(Math.round(e.x+a*Math.cos(s)),Math.round(e.y+a*Math.sin(s))),a+=this._2PI*i/s;return n},Unspiderfy:function(){for(var t=this,e=0,r=this._currentMarkers.length;e<r;++e)this._currentMarkers[e].setLatLng(this._currentCenter).setOpacity(0);var a=this._currentMarkers;window.setTimeout((function(){for(e=0,r=a.length;e<r;++e)t._map.removeLayer(a[e])}),300),this._currentMarkers=[],this._map.removeLayer(this._lines),this._clusterMarker&&this._clusterMarker.setOpacity(1)},onRemove:function(t){this.Unspiderfy(),t.off("overlappingmarkers",this.Spiderfy,this),t.off("click",this.Unspiderfy,this),t.off("zoomend",this.Unspiderfy,this)}});