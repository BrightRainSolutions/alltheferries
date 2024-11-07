require([
	"esri/Map",
	"esri/views/MapView",
	"esri/layers/GraphicsLayer",
	"esri/Graphic",
	"esri/geometry/Point",
	"esri/geometry/Extent",
	"esri/widgets/Locate",
	"esri/widgets/BasemapToggle",
	"esri/widgets/Home",
	"esri/geometry/geometryEngine",
	"esri/core/watchUtils"
], function (Map, MapView, GraphicsLayer, Graphic, Point, Extent, Locate, BasemapToggle, Home, geometryEngine, watchUtils) {
	const app = new Vue({
		el: "#app",
		data: {
			loaded: false,
			isUpdating: false,
			showingIntrobox: true,
			showingFerryInfobox: false,
			showingTerminalInfobox: false,
			showingOutOfExtentNotification: false,
			showAbout: false,
			ferriesGraphicsLayer: null,
			terminalsGraphicsLayer: null,
			selectedFerryGraphicsLayer: null,
			selectedTerminalGraphicsLayer: null,
			selectedFerryMarker: null,
			selectedFerryMarkerSymbol: {
				type: "simple-marker",
				style: "circle",
				color: [255, 255, 255, 0],
				size: "65px",
				outline: {
					color: [0, 123, 95],
					width: 1
				}
			},
			selectedTerminalMarker: null,
			selectedTerminalMarkerSymbol: {
				type: "simple-marker",
				style: "circle",
				color: [255, 255, 255, 0],
				size: "60px",
				outline: {
					color: [0, 123, 95],
					width: 2
				}
			},
			currentZoomLevel: 0,
			lastZoomLevel: 0,
			currentFerrySymbolWidth: 30,
			currentFerrySymbolHeight: 30,
			smallFerrySymbolWidth: 30,
			smallFerrySymbolHeight: 30,
			medFerrySymbolWidth: 40,
			medFerrySymbolHeight: 40,
			largeFerrySymbolWidth: 60,
			largeFerrySymbolHeight: 60,
			mapExtent: {
				type: "extent",
				xmin: -123,
				ymin: 47,
				xmax: -122,
				ymax: 49
			},
			ferryMarkers: {
				headingEast: {
					type: "picture-marker",
					url: "assets/ferry-heading-east.png",
					width: "30px",
					height: "30px",
					angle: 0
				},
				headingWest: {
					type: "picture-marker",
					url: "assets/ferry-heading-west.png",
					width: "30px",
					height: "30px",
					angle: 0
				}
			},
			terminalMarker: {
				type: "picture-marker",
				url: "assets/terminal.svg",
				width: "40px",
				height: "40px",
				angle: 0
			},
			bulletinTerminalMarker: {
				type: "picture-marker",
				url: "assets/terminal-with-bulletin.svg",
				width: "55px",
				height: "43px",
				angle: 0
			},
			config: {
				// https://www.wsdot.wa.gov/Traffic/api/
				ferryFeedUrl: "https://www.wsdot.wa.gov/Ferries/API/Vessels/rest/vessellocations",
				ferryFeedParams: "?apiaccesscode={e7533438-5a9f-4dd6-ab8e-65ccdb7685de}&callback=?",
				// https://www.wsdot.wa.gov/ferries/api/terminals/rest/help
				// https://www.wsdot.wa.gov/ferries/api/terminals/rest/help/operations/GetAllTerminalLocations
				terminalLocationsFeedUrl: "https://www.wsdot.wa.gov/Ferries/API/Terminals/rest/terminallocations",
				terminalBulletinsFeedUrl: "//www.wsdot.wa.gov/Ferries/API/Terminals/rest/terminalbulletins",
				terminalWaitTimesFeedUrl: "//www.wsdot.wa.gov/Ferries/API/Terminals/rest/terminalwaittimes",
				terminalAlertsFeedUrl: " //www.wsdot.wa.gov/Ferries/API/Schedule/rest/alerts",
			},
			selectedVessel: {
				attributes: {
					"VesselID": 2,
					"VesselName": "Chelan",
					"Mmsi": 366709770,
					"DepartingTerminalID": 1,
					"DepartingTerminalName": "Anacortes",
					"DepartingTerminalAbbrev": "ANA",
					"ArrivingTerminalID": null,
					"ArrivingTerminalName": null,
					"ArrivingTerminalAbbrev": null,
					"Latitude": 48.50678,
					"Longitude": -122.676408,
					"Speed": 0,
					"Heading": 248,
					"InService": true,
					"AtDock": true,
					"EtaHuman": "",
					"ScheduledDepartureHuman": "",
					"TimeStampHuman": ""
				}
			},
			// these are the data points that come back from the ferry service
			// and we'll use them as the attributes in our graphics
			vessels: [{
				"VesselID": 2,
				"VesselName": "Chelan",
				"Mmsi": 366709770,
				"DepartingTerminalID": 1,
				"DepartingTerminalName": "Anacortes",
				"DepartingTerminalAbbrev": "ANA",
				"ArrivingTerminalID": null,
				"ArrivingTerminalName": null,
				"ArrivingTerminalAbbrev": null,
				"Latitude": 48.50678,
				"Longitude": -122.676408,
				"Speed": 0,
				"Heading": 248,
				"InService": true,
				"AtDock": true,
				"LeftDock": null,
				"Eta": null,
				// formatted by this app
				"EtaHuman": "",
				"EtaBasis": null,
				"ScheduledDeparture": null,
				// formatted by this app
				"ScheduledDepartureHuman": "",
				"OpRouteAbbrev": [
					"ana-sj"
				],
				"VesselPositionNum": 2,
				"SortSeq": 20,
				"ManagedBy": 1,
				"TimeStamp": "/Date(1613446638000-0800)/",
				// we do this
				"TimeStampHuman": "",
				"VesselWatchShutID": 2,
				"VesselWatchShutMsg": "Vessel data temporarily unavailable.",
				"VesselWatchShutFlag": "0",
				"VesselWatchStatus": "0",
				"VesselWatchMsg": ""
			}],
			terminals: [{
				"TerminalID":2147483647,
				"TerminalSubjectID":2147483647,
				"RegionID":2147483647,
				"TerminalName":"String content",
				"TerminalAbbrev":"String content",
				"SortSeq":2147483647,
				"Latitude":1.26743233E+15,
				"Longitude":1.26743233E+15,
				"AddressLineOne":"String content",
				"AddressLineTwo":"String content",
				"City":"String content",
				"State":"String content",
				"ZipCode":"String content",
				"Country":"String content",
				"MapLink":"String content",
				"Directions":"String content",
				"DispGISZoomLoc":[{
					"ZoomLevel":2147483647,
					"Latitude":1.26743233E+15,
					"Longitude":1.26743233E+15
				}],
				bulletins: [{
					"BulletinTitle":"String content",
					"BulletinText":"String content",
					"BulletinSortSeq":2147483647,
					"BulletinLastUpdated":"\/Date(928174800000-0700)\/",
					"BulletinLastUpdatedSortable":"String content",
					"BulletinLastUpdatedReadable":"String content"
				}],
				waitTimes: [{
					"RouteID": 0,
					"RouteName": "Edmonds / Kingston",
					"WaitTimeIVRNotes": "",
					"WaitTimeLastUpdated": "/Date(1597779070000-0700)/",
					"WaitTimeNotes": "",
					"waitTimeLastUpdatedHuman": ""
				}]
			}],
			selectedTerminal: {
				attributes: {
					"TerminalID":2147483647,
					"TerminalSubjectID":2147483647,
					"RegionID":2147483647,
					"TerminalName":"String content",
					"TerminalAbbrev":"String content",
					"SortSeq":2147483647,
					"Latitude":1.26743233E+15,
					"Longitude":1.26743233E+15,
					"AddressLineOne":"String content",
					"AddressLineTwo":"String content",
					"City":"String content",
					"State":"String content",
					"ZipCode":"String content",
					"Country":"String content",
					"MapLink":"String content",
					"Directions":"String content",
					"DispGISZoomLoc":[{
						"ZoomLevel":2147483647,
						"Latitude":1.26743233E+15,
						"Longitude":1.26743233E+15
					}]
				},
				bulletins: [{
					"BulletinTitle":"String content",
					"BulletinText":"String content",
					"BulletinSortSeq":2147483647,
					"BulletinLastUpdated":"\/Date(928174800000-0700)\/",
					"BulletinLastUpdatedSortable":"String content",
					"BulletinLastUpdatedReadable":"String content"
				}],
				waitTimes: [{
					"RouteID": 0,
					"RouteName": "Edmonds / Kingston",
					"WaitTimeIVRNotes": "",
					"WaitTimeLastUpdated": "/Date(1597779070000-0700)/",
					"WaitTimeNotes": ""
				}]
			}
		},
		mounted() {
			this.init();
			this.loaded = true;
		},
		methods: {
			init() {
				// custom vector tile basemap
				// ToDo: doesn't look that great just yet
				// let niftyCustomBasemap = new Basemap({
				//   baseLayers: [
				//     new VectorTileLayer({
				//       portalItem: {
				//         id: "3c54ce8d9d3141ac9505bdd2bb915ced"
				//       }
				//     })
				//   ]
				// });

				this.map = new Map({
					basemap: "topo-vector"
					//basemap: niftyCustomBasemap,
				});

				this.view = new MapView({
					container: "mapView",
					map: this.map,
					center: [-122.5, 48],
					constraints: {
						rotationEnabled: false,
						geometry: this.mapExtent
					},
					zoom: 8
				});
				this.view.ui.move([ "zoom" ], "bottom-left");

				let basemapToggle = new BasemapToggle({
					view: this.view,
					nextBasemap: "hybrid"
				});

				this.view.ui.add(basemapToggle, {
					position: "bottom-left"
				});

				// allow user to zoom to their location
				// cool if you are on an actual ferry or close to a ferry
				// BUT, we have a constraint on our extent so need to capture if user is not within it
				// we cannot zoom to location if so
				const locate = new Locate({
					view: this.view,
					graphic: new Graphic({
						symbol: {
							type: "simple-marker",
							style: "circle",
							color: "#007B5F",
							size: "12px",
							outline: {
							  color: "white",
							  width: 1
							}
						}
					})
				});
				this.view.ui.add(locate, "bottom-left");
				// fires when the users location is found
				locate.on("locate", e => {
					
					let userLoc = new Point({
						latitude: e.position.coords.latitude,
						longitude: e.position.coords.longitude
					});
					// test if users location is within our map view constraint container
					// if not the map will not pan to the location so let the user know
					const mapExtent = new Extent(this.mapExtent);
					let inExtent = geometryEngine.within(userLoc, mapExtent);
					if(inExtent===false) {
						this.showingOutOfExtentNotification = true;
						setTimeout(() => { this.showingOutOfExtentNotification = false; }, 3000);
					}
				  });

				  const home = new Home({
					view: this.view,
					label: "Go to all the ferries"
				});
				this.view.ui.add(home, "bottom-left");

				this.terminalsGraphicsLayer = new GraphicsLayer();
				this.map.add(this.terminalsGraphicsLayer);

				// the graphics layer that will hold the selected terminal graphic
				this.selectedTerminalGraphicsLayer = new GraphicsLayer();
				this.map.add(this.selectedTerminalGraphicsLayer);

				// the graphics layer that will hold the selected ferry graphic
				this.selectedFerryGraphicsLayer = new GraphicsLayer();
				this.map.add(this.selectedFerryGraphicsLayer);

				this.ferriesGraphicsLayer = new GraphicsLayer();
				this.map.add(this.ferriesGraphicsLayer);
				
				// Get the screen point from the view's click event
				this.view.on("click", event => {
					const screenPoint = {
						x: event.x,
						y: event.y
					};

					this.showingIntrobox = false;

					// Search for graphics at the clicked location
					this.view.hitTest(screenPoint).then(response => {
						if (response.results.length) {
							let clickedVessel = response.results.filter(result => {
								// return if this is a ferry graphic
								return result.graphic.layer === this.ferriesGraphicsLayer;
							});
							let clickedTerminal = response.results.filter(result => {
								// return if this is a terminal graphic
								return result.graphic.layer === this.terminalsGraphicsLayer;
							});
							if (clickedVessel.length > 0) {
								let clickedVesselGraphic = clickedVessel[0].graphic;
								this.showingFerryInfobox = true;
								this.showingTerminalInfobox = false;
								// set to selected
								this.selectedVessel = clickedVesselGraphic;
								// this is the marker that shows under the selected ferry
								this.selectedFerryGraphicsLayer.removeAll();
								this.selectedFerryMarker = new Graphic({
									geometry: clickedVesselGraphic.geometry,
									symbol: this.selectedFerryMarkerSymbol
								});
								this.selectedFerryGraphicsLayer.graphics.add(this.selectedFerryMarker);
								// in case we have a terminal already selected
								this.selectedTerminalGraphicsLayer.removeAll();
							} 
							else if (clickedTerminal.length > 0) {
								let clickedTerminalGraphic = clickedTerminal[0].graphic;
								this.showingTerminalInfobox = true;
								this.showingFerryInfobox = false;
								// oh man don't hate me but we are just going to tack on the bulletins here
								clickedTerminalGraphic.bulletins = [];
								clickedTerminalGraphic.waitTimes = [];
								// set selected terminal to clicked terminal graphic
								this.selectedTerminal = clickedTerminalGraphic;
								this.selectedTerminalGraphicsLayer.removeAll();
								this.selectedTerminalMarker = new Graphic({
									geometry: clickedTerminalGraphic.geometry,
									symbol: this.selectedTerminalMarkerSymbol
								});
								this.selectedTerminalGraphicsLayer.graphics.add(this.selectedTerminalMarker);
								// in case we have a ferry already selected, clear it
								this.selectedFerryGraphicsLayer.removeAll();
								// add any bulletins for the selected terminal
								// note the hack to add the bulletins array required by this function
								this.getSelectedTerminalBulletins();
								this.getSelectedTerminalWaitTimes();
							}
							else {
								// clear select and info box and show intro box
								this.showingFerryInfobox = false;
								this.selectedFerryGraphicsLayer.removeAll();
								this.showingTerminalInfobox = false;
								this.selectedTerminalGraphicsLayer.removeAll();
								this.showingIntrobox = true;
							}
						}
					});
				});

				// call function to get our ferries initially
				// passing in false that this is NOT an update
				this.getFerries(false);

				// get the terminals
				this.getTerminals();

				// set the interval timer to update the ferries at set interval
				setInterval(() => {
					this.getFerries(true);
				}, 8000);

				watchUtils.whenTrue(this.view, "stationary", () => { 
					this.scaleSymbols(this.view.zoom);
				  });
			},
			scaleSymbols(currentZoom) {
				this.currentZoomLevel = currentZoom;
				let needChange = false;
				if(this.currentZoomLevel >= 14 && this.lastZoomLevel < 14) {
					this.currentFerrySymbolWidth = this.largeFerrySymbolWidth;
					this.currentFerrySymbolHeight = this.largeFerrySymbolHeight;
					needChange = true;
				}
				else if(this.currentZoomLevel < 14 && this.lastZoomLevel <= 14) {
					this.currentFerrySymbolWidth = this.smallFerrySymbolWidth;
					this.currentFerrySymbolHeight = this.smallFerrySymbolHeight;
					needChange = true;
				}
				// else if(this.currentZoomLevel < 22 && this.lastZoomLevel >= 22) {
				// 	width = this.largeFerrySymbolWidth;
				// 	height = this.largeFerrySymbolHeight;
				// 	needChange = true;
				// }

				if(needChange) {
					this.ferriesGraphicsLayer.graphics.items.forEach(f => {
						f.symbol = {
							type: f.symbol.type,
							url: f.symbol.url,
							width: this.currentFerrySymbolWidth + "px",
							height: this.currentFerrySymbolHeight + "px",
							angle: f.attributes.Heading
						};
					});
				}
				this.lastZoomLevel = this.currentZoomLevel;
			},
			getSelectedTerminalBulletins() {
				$.getJSON(this.config.terminalBulletinsFeedUrl + 
					"/" + this.selectedTerminal.attributes.TerminalID +
					this.config.ferryFeedParams, terminalBulletin => {
					terminalBulletin.Bulletins.forEach(b => {
						if(this.isToday(b.BulletinLastUpdated)) {
							// set the bulletin time to human readable
							b.BulletinLastUpdatedReadable = this.convertToHumanDate(b.BulletinLastUpdated);
							this.selectedTerminal.bulletins.push(b);
						}
					});
				});
			},
			getSelectedTerminalWaitTimes() {
				$.getJSON(this.config.terminalWaitTimesFeedUrl + 
					"/" + this.selectedTerminal.attributes.TerminalID +
					this.config.ferryFeedParams, terminalWaitTimes => {
					this.selectedTerminal.waitTimes = terminalWaitTimes.WaitTimes.map(wait => {
						let wt = wait;
						wt.waitTimeLastUpdatedHuman = this.convertToHumanDate(wait.WaitTimeLastUpdated);
						return wt;
					});
				});
			},
			getFerries(update) {
				this.isUpdating = true;
				// FETCH doesn't support jsonp\callback but the vessel api requires it
				// so jQuery it is
				$.getJSON(this.config.ferryFeedUrl + this.config.ferryFeedParams, vessels => {
					// if this is an update call find each vessel in our ferries graphics layer
					// and update its position and attributes
					// otherwise this is the first call so create all the ferry vessel graphics
					if (update) {
						// iterate thru all the ferries in the data we just got
						// find the existing graphic (with the same name)
						// and update position, attributes and symbol based on heading
						vessels.forEach(theFerry => {
							let existingFerry = this.ferriesGraphicsLayer.graphics.items.find(f => {
								return f.attributes.VesselName == theFerry.VesselName;
							});
							let pt = new Point({
								latitude: theFerry.Latitude,
								longitude: theFerry.Longitude
							});

							// figure out which symbol to use based on the ferry's heading
							existingFerry.symbol = this.getFerryMarkerSymbol(theFerry.Heading);
							// update position with new lat lon
							existingFerry.geometry = pt;
							// set new attributes (includes ETA, speed, etc.)
							existingFerry.attributes = theFerry;
							existingFerry.attributes.EtaHuman = this.convertToHumanTime(theFerry.Eta);
							existingFerry.attributes.ScheduledDepartureHuman = this.convertToHumanTime(theFerry.ScheduledDeparture);
							existingFerry.attributes.TimeStampHuman = this.convertToHumanTime(theFerry.TimeStamp);
						});
						if (this.showingFerryInfobox) {
							// find and update the selected vessel
							this.selectedVessel = this.ferriesGraphicsLayer.graphics.items.filter(f => {
								return f.attributes.VesselName == this.selectedVessel.attributes.VesselName;
							})[0];
							// update the highlight location too
							this.selectedFerryMarker.geometry = this.selectedVessel.geometry;
						}
					} else {
						// set vessel data and put the ferries on the map
						this.vessels = vessels;

						this.vessels.forEach(ferry => {
							let pt = new Point({
								latitude: ferry.Latitude,
								longitude: ferry.Longitude
							});

							let symbol = this.getFerryMarkerSymbol(ferry.Heading);

							// add formatted dates
							ferry.EtaHuman = this.convertToHumanTime(ferry.Eta);
							ferry.ScheduledDepartureHuman = this.convertToHumanTime(ferry.ScheduledDeparture);
							ferry.TimeStampHuman = this.convertToHumanTime(ferry.TimeStamp);

							let ferryGraphic = new Graphic({
								geometry: pt,
								attributes: ferry,
								symbol: symbol
							});

							this.ferriesGraphicsLayer.graphics.add(ferryGraphic);
						})
					}
					this.isUpdating = false;
				});
			},
			getTerminals() {
				// FETCH doesn't support jsonp\callback but the terminal api requires it
				// so jQuery it is
				$.getJSON(this.config.terminalLocationsFeedUrl + this.config.ferryFeedParams, terminals => {
					// set terminals data and put the terminals on the map
					this.terminals = terminals;

					this.terminals.forEach(terminal => {
						terminal.bulletins = [];
						let pt = new Point({
							latitude: terminal.Latitude,
							longitude: terminal.Longitude
						});

						let symbol = this.getTerminalMarkerSymbol();

						let terminalGraphic = new Graphic({
							geometry: pt,
							attributes: terminal,
							symbol: symbol
						});

						this.terminalsGraphicsLayer.graphics.add(terminalGraphic);
					});
					// now see if there are any bulletins issued today for any of our terminals
					$.getJSON(this.config.terminalBulletinsFeedUrl + this.config.ferryFeedParams, terminalBulletins => {
						terminalBulletins.forEach(terminalBulletin => {
							// find the terminal this bulletin belongs to
							let terminalForBulletin = this.terminals.find(terminal => 
								terminal.TerminalID == terminalBulletin.TerminalID
							);
							// if this bulletin was issues today add it to this terminals Today's Bulletins
							terminalBulletin.Bulletins.forEach(b => {
								if(this.isToday(b.BulletinLastUpdated)) {
									// set the bulletin time to human readable
									b.BulletinLastUpdatedReadable = this.convertToHumanDate(b.BulletinLastUpdated);
									terminalForBulletin.bulletins.push(b);
									// get the graphic related to this terminal
									let existingTerminalGraphic = this.terminalsGraphicsLayer.graphics.items.find(t => {
										return t.attributes.TerminalID == terminalForBulletin.TerminalID;
									});
									// set the terminal graphic symbol to marker
									existingTerminalGraphic.symbol = this.bulletinTerminalMarker;
								}
							});
							
						});
					});
				});
			},
			zoomToSelectedFerry() {
				this.view.goTo({
					target: this.selectedVessel,
					zoom: 14
				});
			},
			zoomToSelectedTerminal() {
				this.view.goTo({
					target: this.selectedTerminal,
					zoom: 14
				});
			},
			getFerryMarkerSymbol(heading) {
				// We have two icons defined in our data
				// one for ferrys heading west and another east
				// both oriented correctly
				// so determine which icon to use based on the heading
				// then set the angle of the icon and return it
				if (heading > 0 && heading <= 180) {
					this.ferryMarkers.headingEast.angle = heading;
					this.ferryMarkers.headingEast.width = this.currentFerrySymbolWidth;
					this.ferryMarkers.headingEast.height = this.currentFerrySymbolHeight;
					return this.ferryMarkers.headingEast;
				} else {
					this.ferryMarkers.headingWest.angle = heading;
					this.ferryMarkers.headingWest.width = this.currentFerrySymbolWidth;
					this.ferryMarkers.headingWest.height = this.currentFerrySymbolHeight;
					return this.ferryMarkers.headingWest;
				}
			},
			getTerminalMarkerSymbol(heading) {
				// ToDo: can we determine the orientation of the dock?
				// see ferry marker symbol to set symbol if so
				return this.terminalMarker;
			},
			convertToHumanTime(vesselAPIDate) {
				if (vesselAPIDate != null) {
					// e.g. of what is returned from vessels api
					// "/Date(1613446638000-0800)/"
					// need to peel out the epoch time
					let left = vesselAPIDate.split("-")[0];
					let epochString = left.replace("/Date(", "");
					var epochTimestamp = parseInt(epochString);
					let timestamp = new Date(epochTimestamp).toLocaleString('en-US', {
						timeZone: 'America/Los_Angeles'
					});
					// split out just the time
					let time = timestamp.split(",")[1].trim();
					return time;
				} else {
					return "unavailable";
				}
			},
			convertToHumanDate(aPIDate) {
				if (aPIDate != null) {
					// e.g. of a date returned from api
					// "/Date(1613446638000-0800)/"
					// need to peel out the epoch time
					let left = aPIDate.split("-")[0];
					let epochString = left.replace("/Date(", "");
					var epochTimestamp = parseInt(epochString);
					let timestamp = new Date(epochTimestamp).toLocaleString('en-US', {
						timeZone: 'America/Los_Angeles'
					});
					return timestamp;
				} else {
					return "unavailable";
				}
			},
			isToday(aPIDate) {
				// e.g. of a date returned from api
				// "/Date(1613446638000-0800)/"
				let left = aPIDate.split("-")[0];
				let epochString = left.replace("/Date(", "");
				// we know this will be in local time
				const epochNum = parseInt(epochString);
				const theDate = new Date(epochNum);
				const today = new Date(new Date().toLocaleString('en-US', {
					timeZone: 'America/Los_Angeles'
				}));
				if(this.getShortDate(theDate) == this.getShortDate(today)) {
					return true;
				}
				else {
					return false;
				}
			},
			getShortDate(d) {
				let year = d.getFullYear();
				let month = d.getMonth() + 1;
				let day = d.getDate();
				return `${year}-${month}-${day}`
			}
		}
	});
});