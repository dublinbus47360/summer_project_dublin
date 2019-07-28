var currentMap;
// First map rendered when the page is loaded
function myMap() {
  var myCenter = {lat: 53.349605, lng:-6.264175 };
  var mapCanvas = document.getElementById("map");
  var mapOptions = {center: myCenter, zoom: 12};
  var map = new google.maps.Map(mapCanvas, mapOptions);
  infowindow = new google.maps.InfoWindow({
    maxWidth: 355
  });
  currentMap = map;
}


// JQuery functions to access CSRFToken from external JS (https://docs.djangoproject.com/en/1.9/ref/csrf/#ajax)
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
var csrftoken = getCookie('csrftoken');

function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}
$.ajaxSetup({
    beforeSend: function(xhr, settings) {
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }
});

// Gets bus lines and set as options for search route function
function getBusLines() {
  $.ajax({
    type: "POST",
    url: "/get_busLines/",
    data: { csrfmiddlewaretoken: csrftoken },
    success: function(response) {
      bus_lines = JSON.parse(response).bus_lines;
      // console.log(bus_lines);
      for (var i=0; i<bus_lines.length; i++) {
        document.getElementById('bus_line').innerHTML += '<option>' + bus_lines[i][0] + ' (' + bus_lines[i][1] + ')</option>';
      }
    }
  })
}
getBusLines();

// Create new date object after custom number of days have passed
Date.prototype.addDays = function(days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
}

// Create options for five days  (up to weather forecast possibilities)
var dateNew = new Date();
var dateNew1 = dateNew.addDays(1);
var dateNew2 = dateNew.addDays(2);
var dateNew3 = dateNew.addDays(3);
var dateNew4 = dateNew.addDays(4);

var ourdate = dateNew.getFullYear() + "-" + ("0"+(dateNew.getMonth()+1)).slice(-2) + "-" + ("0"+dateNew.getDate()).slice(-2);
var ourDate1 = dateNew1.getFullYear() + "-" + ("0"+(dateNew1.getMonth()+1)).slice(-2) + "-" + ("0"+dateNew1.getDate()).slice(-2);
var ourDate2 = dateNew2.getFullYear() + "-" + ("0"+(dateNew2.getMonth()+1)).slice(-2) + "-" + ("0"+dateNew2.getDate()).slice(-2);
var ourDate3 = dateNew3.getFullYear() + "-" + ("0"+(dateNew3.getMonth()+1)).slice(-2) + "-" + ("0"+dateNew3.getDate()).slice(-2);
var ourDate4 = dateNew4.getFullYear() + "-" + ("0"+(dateNew4.getMonth()+1)).slice(-2) + "-" + ("0"+dateNew4.getDate()).slice(-2);

document.getElementById('date').innerHTML += "<option value='"+ourdate+"'>"+ourdate.slice(-2) + '/' + ourdate.slice(5,7)+"</option><option value='"+ourDate1+"'>"+ourDate1.slice(-2) + '/' + ourDate1.slice(5,7)+"</option><option value='"+ourDate2+"'>"+ourDate2.slice(-2) + '/' + ourDate2.slice(5,7)+"</option><option value='"+ourDate3+"'>"+ourDate3.slice(-2) + '/' + ourDate3.slice(5,7)+"</option><option value='"+ourDate4+"'>"+ourDate4.slice(-2) + '/' + ourDate4.slice(5,7)+"</option>"

// Create options for time
// var value;
// for (var j = 0; j < 24; j++) {
//   for (var k = 0; k < 60; k+=10) {
//     if (k == 0) {
//       value = ('0' + j + ':0' + k + ':00').slice(-8);
//     } else {
//       value = ('0' + j + ':' + k + ':00').slice(-8);
//     }
//     document.getElementById('time').innerHTML += "<option value='" + value + "'>" + value.slice(0,5) +"</option>";
//   }
// }

// Get events details from TicketMaster API and display on the page
var events_content;
var eventsResult;
var eventMarkers = [];
var attractionMarkers = [];

function getEvents() {
  $.ajax({
    type: "POST",
    url: "/get_events/",
    data: { csrfmiddlewaretoken: csrftoken, today: ourdate, lastDay: ourDate4},
    success: function(response) {
      eventsResult = JSON.parse(response).eventsResponse;
      console.log(eventsResult);
      var months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      for (var i = 0; i < eventsResult.length; i++) {
        var d = new Date(eventsResult[i][1]);
        document.getElementById('events').innerHTML += '<div class="forToggle col-md-3 d-none d-md-block"><div class="event clickable_event"><div class="event_date"><span class="grey_text">'+months[d.getMonth()]+'</span><span>'+d.getDate()+'</span></div><div class="event_info" onclick="goEvent(\''+eventsResult[i][3]+'\')"><span class="grey_text">'+days[d.getDay()]+' - '+eventsResult[i][2].slice(0,5)+'</span><span>'+eventsResult[i][0]+'</span><span class="grey_text">'+eventsResult[i][3]+'</span></div></div></div>';

      }
      events_content = document.getElementById('events').innerHTML;

      for(var j=0; j<eventsResult.length; j++) {
        var marker=new google.maps.Marker({
        position:new google.maps.LatLng(eventsResult[j][4].latitude,eventsResult[j][4].longitude),
        // map:map,
        icon: {
          path: "M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z",
          scale: 0.03,
          fillColor: '#22e866',
          fillOpacity: 1.0,
          strokeWeight: 1
        },
        event: eventsResult[j][0],
        date: eventsResult[j][1],
        time: eventsResult[j][2],
        venue: eventsResult[j][3]
        });

        popupDirections(marker);
        eventMarkers.push(marker);
      }

      // Display google maps markers
      function popupDirections(marker) {
        google.maps.event.addListener(marker, 'click', function() {
          for (var i=0; i<eventsResult.length; i++) {
            infowindow.setContent('<span class="infowindowTitle">Event:</span> ' + marker.event + '<br><span class="infowindowTitle">Date:</span> ' + marker.date + '<br><span class="infowindowTitle">Time:</span> ' + marker.time.slice(0,5) + '<br><span class="infowindowTitle">Venue:</span> ' + marker.venue + '<br><span class="goToSpan" onclick="goEvent(\''+ (marker.venue).replace("'", "§") +'\')">Set as destination</span>');
          }
          infowindow.open(map, marker);
        });
      }

      function getAttractions() {
        for(var j=0; j<attractions.results.length; j++) {
          var marker2=new google.maps.Marker({
          position:new google.maps.LatLng(attractions.results[j].geometry.location.lat,attractions.results[j].geometry.location.lng),
          // map:map,
          icon: {
            path: "M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z",
            scale: 0.03,
            fillColor: '#ee19b9',
            fillOpacity: 1.0,
            strokeWeight: 1
          },
          name: attractions.results[j].name
          });

          popupDirections2(marker2);
          attractionMarkers.push(marker2);
        }

        // Display google maps markers
        function popupDirections2(marker) {
          google.maps.event.addListener(marker, 'click', function() {
            for (var i=0; i<attractions.results.length; i++) {
              infowindow.setContent('<span class="infowindowTitle">' + marker.name + '</span><br><span class="goToSpan" onclick="goEvent(\''+ (marker.name).replace("'", "§") +'\')">Set as destination</span>');
            }
            infowindow.open(map, marker);
          });
        }
      }

      getAttractions();

      toggleEventMarkers();
      toggleTourismMarkers();
    }
  })
}

function goEvent(place) {
  if (media_query.matches) {
    document.getElementById('burger_button').click();
  }
  destInput = document.getElementById('destinationInput');
  destInput.focus();
  destInput.style.backgroundColor = 'lightgrey';
  destInput.value = place.replace("§", "'") + ', Dublin';
  setTimeout(function() {
    destInput.style.backgroundColor = 'white';
    destInput.blur();
  }, 700);
}

getEvents();

var toggle_count3 = 0;
function toggleEventMarkers() {
  if (toggle_count3 == 0) {
    for (var i = 0; i < eventMarkers.length; i++) {
      eventMarkers[i].setMap(currentMap);
    }
    $("#filterEvent").addClass('filterClicked');
    toggle_count3 = 1;
  } else {
    for (var i = 0; i < eventMarkers.length; i++) {
      eventMarkers[i].setMap(null);
    }
    $("#filterEvent").removeClass('filterClicked');
    toggle_count3 = 0;
  }
}

var toggle_count4 = 0;
function toggleTourismMarkers() {
  if (toggle_count4 == 0) {
    for (var i = 0; i < attractionMarkers.length; i++) {
      attractionMarkers[i].setMap(currentMap);
    }
    $("#filterTourism").addClass('filterClicked');
    toggle_count4 = 1;
  } else {
    for (var i = 0; i < attractionMarkers.length; i++) {
      attractionMarkers[i].setMap(null);
    }
    $("#filterTourism").removeClass('filterClicked');
    toggle_count4 = 0;
  }
}


// Toggle hamburguer menu
var toggle_count = 0;
function toggle_menu() {
  if (toggle_count == 0) {
    $("#form").removeClass("d-none");
    $("#form").removeClass("d-md-block");
    $("#form").removeClass("col-md-3");
    toggle_count = 1;
    if (toggle_count2 == 1) {
      document.getElementById('bottom_title').click();
    }
  } else {
    $("#form").addClass("d-none");
    $("#form").addClass("d-md-block");
    $("#form").addClass("col-md-3");
    toggle_count = 0;
  }
}

// Toggle bottom buttom
var toggle_count2 = 0;
document.getElementById('bottom_button').addEventListener("click", function() {
  if (toggle_count2 == 0) {
    $(".forToggle").removeClass("d-none");
    $(".forToggle").removeClass("d-md-block");
    $("#event1").removeClass("d-none");
    $("#event1").removeClass("d-md-block");
    $("#event2").removeClass("d-none");
    $("#event2").removeClass("d-md-block");
    $("#event3").removeClass("d-none");
    $("#event3").removeClass("d-md-block");
    toggle_count2 = 1;
    $(".bottom_drop").css({"top":"50vh"});
  } else {
    $(".forToggle").addClass("d-none");
    $(".forToggle").addClass("d-md-block");
    $("#event1").addClass("d-none");
    $("#event1").addClass("d-md-block");
    $("#event2").addClass("d-none");
    $("#event2").addClass("d-md-block");
    $("#event3").addClass("d-none");
    $("#event3").addClass("d-md-block");
    toggle_count2 = 0;
    $(".bottom_drop").css({"top":"95vh"});
  }
})


// Call google API to get all stops of a given route and display them on the page
function showRoute() {
  var bus_line = document.getElementById('bus_line').value;

  if (bus_line == 'Null') {
    window.alert('Please select a bus line.');
    return;
  }

  $.ajax({
    type: "POST",
    url: "/show_route/",
    data: { csrfmiddlewaretoken: csrftoken, bus_line: bus_line },
    success: function(response) {
      var myData = JSON.parse(response);
      console.log(myData);

      var myCenter = {lat: 53.349605, lng:-6.264175 };
      var mapCanvas = document.getElementById("map");
      var mapOptions = {center: myCenter, zoom: 11};
      var map = new google.maps.Map(mapCanvas, mapOptions);
      infowindow = new google.maps.InfoWindow({
        maxWidth: 355
      });

      currentMap = map;
      $("#filterEvent").removeClass('filterClicked');
      $("#filterTourism").removeClass('filterClicked');

      for(var j=0; j<myData.route_stops.length; j++) {
        var marker=new google.maps.Marker({
        position:new google.maps.LatLng(myData.route_stops[j][7],myData.route_stops[j][9]),
        map:map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 4,
          fillColor: '#5b94df',
          fillOpacity: 1.0,
          strokeWeight: 1,
          strokeColor: 'white'
        },
        stop_id: myData.route_stops[j][1],
        stop_name: myData.route_stops[j][11]
        });

        popupDirections(marker);
      }

      // Display google maps markers
      function popupDirections(marker) {
        google.maps.event.addListener(marker, 'click', function() {
          for (var i=0; i<myData.route_stops.length; i++) {
            infowindow.setContent('Stop Number: ' + marker.stop_id.slice(-4) + '<br> Stop Name: ' + marker.stop_name);
          }
          infowindow.open(map, marker);
        });
      }
    }
  })
  $("#route").addClass("d-none");
  document.getElementById('events').innerHTML = events_content;
  document.getElementById('events').style.setProperty('overflow', 'scroll');
  document.getElementById('events').style.setProperty('max-height', '115px');
  document.getElementById('events').style.setProperty('padding-left', '20px');
  document.getElementById('bottom_title').innerHTML = 'Events';
  if (media_query.matches) {
    document.getElementById('burger_button').click();
  }
}

// Google Maps -------------------
// Set autocomplete to get the origin
function setOrigin() {
  var origin = document.getElementById("originInput");
  var autocomplete = new google.maps.places.Autocomplete(origin);
  autocomplete.setComponentRestrictions({'country': ['ie']});
}

// Set autocomplete to get the destination
function setDestination() {
  var destination = document.getElementById("destinationInput");
  var autocomplete = new google.maps.places.Autocomplete(destination);
  autocomplete.setComponentRestrictions({'country': ['ie']});
}

// Call google API to get route options and display the optimal one on the page
function searchRoute() {
  var origin = document.getElementById("originInput").value;
  var destination = document.getElementById("destinationInput").value;

  if (!origin || !destination) {
    window.alert('Please enter valid origin and destination.');
    return;
  }

  var middle_stops;
  var selected_date = document.getElementById('date').value;
  var selected_time = document.getElementById('time').value;
  var now = new Date();
  var dateNow = now.getFullYear() + '-' + ('0' + (parseInt(now.getMonth())+1)).slice(-2) + '-' + now.getDate();
  var timeNow = now.getHours() + ':' + now.getMinutes() + ':00';
  var startTime, year, month, day, hour, min, datetime;
  if (selected_date == 'Null' && selected_time == 'Enter Time (optional)') {
    startTime = now;
    datetime = dateNow + ' ' + timeNow;
  } else if (selected_date == 'Null') {
    startTime = now;
    hour = parseInt(selected_time.slice(0, 2));
    min = parseInt(selected_time.slice(3, 5));
    startTime.setHours(hour);
    startTime.setMinutes(min);
    datetime = dateNow + ' ' + selected_time;
  } else if (selected_time == 'Enter Time (optional)') {
    startTime = now;
    year = parseInt(selected_date.slice(0, 4));
    month = parseInt(selected_date.slice(5, 7))-1;
    day = parseInt(selected_date.slice(8, 10));
    startTime.setFullYear(year, month, day);
    datetime = selected_date + ' ' + timeNow;
  } else {
    year = parseInt(selected_date.slice(0, 4));
    month = parseInt(selected_date.slice(5, 7))-1;
    day = parseInt(selected_date.slice(8, 10));
    hour = parseInt(selected_time.slice(0, 2));
    min = parseInt(selected_time.slice(3, 5));
    startTime = new Date(year, month, day, hour, min);
    datetime = selected_date + ' ' + selected_time;
  }

  var directionsDisplay = new google.maps.DirectionsRenderer;
  var directionsService = new google.maps.DirectionsService;

  var myCenter = {lat: 53.349605, lng:-6.264175 };
  var mapCanvas = document.getElementById("map");
  var mapOptions = {center: myCenter, zoom: 11};
  var map = new google.maps.Map(mapCanvas, mapOptions);
  infowindow = new google.maps.InfoWindow({
    maxWidth: 355
  });

  currentMap = map;
  $("#filterEvent").removeClass('filterClicked');
  $("#filterTourism").removeClass('filterClicked');

  directionsDisplay.setMap(map);

  directionsService.route({
    origin: origin,
    destination: destination,
    travelMode: google.maps.TravelMode['TRANSIT'],
    transitOptions: {modes: ['BUS'], departureTime: startTime},
    provideRouteAlternatives: true
  }, function(response, status) {
    // console.log(startTime);
    if (status == 'OK') {
      console.log(response);
      var googleRequest = response;
      $.ajax({
        type: "POST",
        url: "/search_route/",
        data: { csrfmiddlewaretoken: csrftoken, googleRequest: JSON.stringify(response), start_time: datetime },
        success: function(response) {
          if (response == 'invalid_time') {
            window.alert('Pelase enter a valid time.');
            return;
          }
          directionsDisplay.setDirections(googleRequest);
          var myData = JSON.parse(response);
          console.log(myData);
          middle_stops = myData.middle_stops;
          journey_forecast = myData.journey_forecast;
          displayIntermediate(middle_stops[0]);
          displayJourneyInfo(googleRequest, 0, journey_forecast);
          document.getElementById('route_options').innerHTML='';
          var optionsArray = [];
          for (var i = 0; i < googleRequest.routes.length; i++) {
            var steps = googleRequest.routes[i].legs[0].steps;
            var option_title = '';
            for (var k = 0; k < steps.length; k++) {
              if (steps[k].travel_mode == 'TRANSIT') {
                option_title += steps[k].transit.line.short_name;
                option_title += ' / ';
              }
            }
            if (option_title == '') {
              option_title += 'Walking';
            } else {
              option_title = option_title.slice(0, -3);
            }

            if (!optionsArray.includes(option_title)) {
              document.getElementById('route_options').innerHTML+='<option value="' + i + '">' + option_title + '</option>';
              optionsArray.push(option_title);
            }
          }
          var route_select = document.getElementById('route_options');
          route_select.onchange = function() {
            while(markersArray.length) {
              markersArray.pop().setMap(null);
            }
            directionsDisplay.setRouteIndex(parseInt(route_select.value));
            displayIntermediate(middle_stops[parseInt(route_select.value)]);
            displayJourneyInfo(googleRequest, parseInt(route_select.value), journey_forecast);
          }
          $("#route").removeClass("d-none");
          // directionsDisplay.setPanel(document.getElementById('panel'));
          // console.log(directionsDisplay.getPanel());
        }
      })

      // Display intermediate bus stops for a given route option
      var markersArray = [];
      function displayIntermediate(middle_stops) {
        for (var i = 0; i < middle_stops.length; i++) {
          if (typeof middle_stops[i] != 'string') {
            for(var j=0; j<middle_stops[i].length; j++) {
              var marker=new google.maps.Marker({
              position:new google.maps.LatLng(middle_stops[i][j][4],middle_stops[i][j][5]),
              map:map,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 2.5,
                fillColor: 'white',
                fillOpacity: 1.0,
                strokeWeight: 1
              },
              stop_id: middle_stops[i][j][0],
              stop_name: middle_stops[i][j][6]
              });

              markersArray.push(marker);
              popupDirections(marker);
            }
          }
        }

        // Display google maps markers
        function popupDirections(marker) {
          google.maps.event.addListener(marker, 'click', function() {
            for (var i=0; i<middle_stops.length; i++) {
              infowindow.setContent('Stop Number: ' + marker.stop_id.slice(-4) + '<br> Stop Name: ' + marker.stop_name);
            }
            infowindow.open(map, marker);
          });
        }
      }

      // Display all journey info on the bottom of the page
      function displayJourneyInfo(googleRequest, option, journey_forecast) {
        var journey_summary = '<p>';
        var steps = googleRequest.routes[option].legs[0].steps;
        for (var i = 0; i < steps.length; i++) {
          if (steps[i].travel_mode == 'WALKING') {
            journey_summary += '<i class="fas fa-walking"></i> ' + steps[i].duration.text.slice(0,-5);
          } else if (steps[i].travel_mode == 'TRANSIT') {
            journey_summary += '<i class="fas fa-bus"></i> ' + steps[i].transit.line.short_name;
          }
          if (i < steps.length -1) {
            journey_summary += '<i class="fas fa-angle-right step_arrow"></i>'
          }
        }
        journey_summary += '</p>';
        var journey_steps = '';
        for (var i = 0; i < steps.length; i++) {
          journey_steps += '<p class="journey_step"><span>' + (i+1) + '. </span>'+ steps[i].instructions;
          if (steps[i].travel_mode == 'TRANSIT') {
            journey_steps += '<span> at ' + steps[i].transit.departure_time.text + 'h</span>';
          }
          journey_steps += '</p>';
        }

        document.getElementById('bottom_title').innerHTML = 'Journey';
        document.getElementById('events').innerHTML = '<div id="event1" class="col-md-4 d-none d-md-block"><div class="eventJourney"><div class="event_date"><span class="grey_text">INFO</span><span class="grey_text"style="font-size: 2em;"><i class="fas fa-info-circle"></i></span></div><div class="event_info">'+journey_summary+'<span><i class="fas fa-flag-checkered distance_time"></i> '+googleRequest.routes[option].legs[0].distance.text+'</span><span><i class="fas fa-stopwatch distance_time"></i> '+googleRequest.routes[option].legs[0].duration.text+'</span></div></div></div><div id="event2" class="col-md-4 d-none d-md-block"><div class="eventJourney"><div class="event_date"><span class="grey_text">STEPS</span><span class="grey_text" style="font-size: 2em;"><i class="fas fa-directions"></i></span></div><div class="event_info journey_steps">'+journey_steps+'</div></div></div><div id="event3" class="col-md-4 d-none d-md-block"><div class="eventJourney"><div class="event_date"><span class="grey_text">ECO</span><span class="grey_text" style="font-size: 2em;"><i class="fas fa-globe-americas"></i></span></div><div class="event_info"><span></span><span>Weather Forecast - ' + journey_forecast + '</span><span>CO2 Emission - 0.0 tonnes</span></div></div></div>';
        if (media_query.matches) {
          if (toggle_count2 == 0) {
            document.getElementById('bottom_button').click();
          } else {
            $("#event1").removeClass("d-none");
            $("#event1").removeClass("d-md-block");
            $("#event2").removeClass("d-none");
            $("#event2").removeClass("d-md-block");
            $("#event3").removeClass("d-none");
            $("#event3").removeClass("d-md-block");
          }
        }
        document.getElementById('events').style.setProperty('overflow', 'auto');
        document.getElementById('events').style.setProperty('max-height', 'none');
        document.getElementById('events').style.setProperty('padding-left', '0px');
      }
    } else {
      window.alert('Error:' + status);
    }
  });
}
