$(document).ready(function () {
  var baseUrl = "https://smart-track-be.herokuapp.com/";
  initDashboard();

  getMaster();
  var flightClicked = 0;
  // setInterval(function () {
  //   getMaster();
  //   if (1 == 1) {
  //     //callcalcRoute();
  //   }

  // }, 10000);

  var equipment, style, geojson;
  getNotification();
  // Basic functions
  function initDashboard() {
    httpGet('ping', function (result) {
      console.log(result);
    });
  }

  function getMaster() {
    httpGet('getMaster', function (result) {
      //flight 
      console.log(result)
      $(".dashboard-table > tbody").html("");
      var flight = result.data.flight;
      for (let index = 0; index < flight.length; index++) {
        const element = flight[index];
        $(".dashboard-table > tbody").append("<tr class='bayId'><td><div>" + element.name + "</div></td></tr>");
      };
      equipment = result.data.equipment;
      style = result.data.style;
      geojson = result.data.geojson;
      console.log(geojson);
      initMap();
      callcalcRoute();
    });

    httpGet('getBay', function (result) {

    });
  }

  function getNotification() {
    httpGet('getNotification', function (result) {
      var flight = result.message;
      for (let index = 0; index < flight.length; index++) {
        const element = flight[index];
        $(".notification").append("<div>" + element.message + "</div>");
      };
    });
  }
  // Common Functions

  function httpGet(url, callback) {
    $.get(baseUrl + url, function (data, status) {
      callback(data);
    });
  }


  // on click

  //  $(document).on("click",".bayId",function() {
  $(".dashboard-table").click(function () {
    flightClicked = 1;
    callcalcRoute();
  });


  function callcalcRoute() {
    for (i = 0; i < equipment.length; i++) {
      var src = '"' + equipment[i].lat + ',' + equipment[i].lng + '"';
      var des = '"' + geojson.features[0].geometry.coordinates[0][0][1] + ',' + geojson.features[0].geometry.coordinates[0][0][0] + '"';
      calcRoute(src, des,'', "assets/icons/" + equipment[i].icon, i);
    }
  }

  // initMap();
  function initMap() {
    // Styles a map in night mode.
    var myOptions = {
      zoom: 14,
      disableDefaultUI: true,
      center: new google.maps.LatLng(12.949152, 80.185317),
      styles: style,
      //  center: new google.maps.LatLng(12.9490, 80.1828),
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("map"), myOptions);
    var infowindow = new google.maps.InfoWindow();
    var marker, i;
    map.data.loadGeoJson(baseUrl + "geojson.json");
  }
});


//end of doc ready
var map;
var RouteCoordinates = [];
var Routes = [];
var DrivePath, ResLocInterval;
var directionsService = new google.maps.DirectionsService();

function calcRoute(start, end, FromRes, icon, item) {
  for (var i = 0; i < Routes.length; i++) {
    if (Routes[i].Title == FromRes) {
      if (Routes[i].PolyLine != null || Routes[i].PolyLine != undefined) {
        Routes[i].PolyLine.setMap(null);
        Routes[i].PolyLine = null;
        clearInterval(Routes[i].Interval);
        Routes[i].Direction.setMap(null);
      }
      Routes.splice(i, 1);
      break;
    }
  }


  var directionsDisplay = new google.maps.DirectionsRenderer({
    draggable: true,
    map: map,
    polylineOptions: {
      strokeColor: RouteColor[item],
      strokeOpacity: 0.4,
      strokeWeight: 5
    },
    markerOptions: {
      title: FromRes,
      icon: icon
    }
  });
  console.log('icon', icon);
  var objRoute = new Object();
  objRoute.Title = FromRes;
  objRoute.PolyLine = null;
  objRoute.Interval = null;
  objRoute.OffSetCnt = 0;
  objRoute.Direction = directionsDisplay;
  Routes.push(objRoute);
  google.maps.event.addListener(directionsDisplay, 'directions_changed', function (e) {
    ShowPolyLine(directionsDisplay.getDirections(), directionsDisplay.markerOptions.title);
  });
  var request = {
    origin: start,
    destination: end,
    travelMode: google.maps.TravelMode.WALKING,
    provideRouteAlternatives: false
  };
  directionsService.route(request, function (result, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      directionsDisplay.setDirections(result);
    }
  });
}


function ShowPolyLine(result, Title) {
  RouteCoordinates = [];
  for (var i = 0; i < result.routes[0].overview_path.length; i++) {
    RouteCoordinates.push(new google.maps.LatLng(result.routes[0].overview_path[i].lat(), result.routes[0].overview_path[i].lng()))
  }
  var Filter = $(Routes).filter(function () {
    return this.Title == Title;
  })
  var lineSymbol = {
    scale: 3,
    fillColor: '#FF0000',
    fillOpacity: 0.7,
    strokeOpacity: 0.7,
    strokeWeight: 4
  };
  Filter[0].PolyLine = new google.maps.Polyline({
    map: map,
    path: RouteCoordinates,
    icons: [{
      icon: lineSymbol,
      offset: '100%'
    }],
    geodesic: true,
    strokeColor: "#0094ff",
    strokeOpacity: 1.0,
    strokeWeight: 5
  });
}

var RouteColor = ["#0094ff", "#479f67", "#3c9a94", "#a17b4b",
  "#4ad98a", "#50cfe1", "#8ad3a4", "#40cbf1",
  "#5ecf98", "#17c31f"
];