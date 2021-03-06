/* eslint-disable import/no-webpack-loader-syntax */
import React, { useRef, useEffect, useState } from "react";
import "./App.css";
import mapboxgl from "mapbox-gl/dist/mapbox-gl-csp";
import MapboxWorker from "worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import * as turf from "@turf/turf";
import { Slider } from "@material-ui/core";

function App() {
  const mapContainer = useRef();
  const [map, setMap] = useState();
  const [draw, setDraw] = useState();
  const [lng, setLng] = useState(29.031);
  const [lat, setLat] = useState(41.1597);
  const [lines, setLines] = useState([
    [
      [29.025, 41.1637],
      [29.0369, 41.1637],
    ],
    [
      [29.025, 41.1587],
      [29.0369, 41.1587],
    ],
  ]);
  const [zoom, setZoom] = useState(14);
  const [firstLine, setFirstLine] = useState();
  const [secondLine, setSecondLine] = useState();
  useEffect(() => {
    mapboxgl.workerClass = MapboxWorker;
    mapboxgl.accessToken =
      "pk.eyJ1IjoiYXRhbGhhbSIsImEiOiJja2x3Z2lncW8xNjJ4MnZtd2Q0cXVxbHR3In0.5NpbtgGH8-a1b87p4FKGVw";

    const initializeMap = ({ setMap, mapContainer }) => {
      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [lng, lat],
        zoom: zoom,
      });
      setMap(mapInstance);
      var drawInstance = new MapboxDraw();
      setDraw(drawInstance);
    };

    if (!map) initializeMap({ setMap, mapContainer });

    return () => map.remove();
  }, []);

  useEffect(() => {
    if (!map) return;

    map.addControl(draw, "top-right");
    map.on("draw.create", () => {
      var data = draw.getAll();
      var line1 = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: lines[0],
        },
      };

      var line2 = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: lines[1],
        },
      };

      var intersectsFirstLine = turf.lineIntersect(data, line1);
      var intersectsSecondLine = turf.lineIntersect(data, line2);
      if(intersectsFirstLine && intersectsFirstLine.features.length === 2) {
        var firstCoordinates = [];
        firstCoordinates.push(intersectsFirstLine.features[0].geometry.coordinates);
        firstCoordinates.push(intersectsFirstLine.features[1].geometry.coordinates);
        var firstIntersection = {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: firstCoordinates,
          },
        };
        console.log("firstIntersection", firstIntersection);
        setFirstLine(firstIntersection);

        map.addSource(`route${3}`, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: firstCoordinates,
            },
          },
        });
        map.addLayer({
          id: `route${3}`,
          type: "line",
          source: `route${3}`,
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#000",
            "line-width": 8,
          },
        });


      }
      if(intersectsSecondLine && intersectsSecondLine.features.length === 2) {
        var secondCoordinates = [];
        secondCoordinates.push(intersectsSecondLine.features[0].geometry.coordinates);
        secondCoordinates.push(intersectsSecondLine.features[1].geometry.coordinates);
        var secondIntersection = {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: secondCoordinates,
          },
        };
        console.log("secondIntersection", secondIntersection);
        setSecondLine(secondIntersection);

        map.addSource(`route${4}`, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: secondCoordinates,
            },
          },
        });
        map.addLayer({
          id: `route${4}`,
          type: "line",
          source: `route${4}`,
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#000",
            "line-width": 8,
          },
        });
      }
    });

    map.on("load", function () {
      lines.forEach((item, index) => {
        map.addSource(`route${index}`, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: item,
            },
          },
        });
        map.addLayer({
          id: `route${index}`,
          type: "line",
          source: `route${index}`,
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#888",
            "line-width": 5,
          },
        });
      });
    });
  }, [map]);

  useEffect(() => {
    if (!map) return;

    map.on("move", () => {
      map.removeLayer('route3');
      map.removeLayer('route4');

      var centerLng = map.getCenter().lng.toFixed(4);
      var centerLat = map.getCenter().lat.toFixed(4);

      var tempLines = lines.map((item, index) => {
        var tempItem = item.map((array, index) => {
          var tempArray = [];
          const firstLngDiff = array[0] - lng;
          const firstLatDiff = array[1] - lat;
          tempArray.push(firstLngDiff + parseFloat(centerLng));
          tempArray.push(firstLatDiff + parseFloat(centerLat));
          return tempArray;
        });

        return tempItem;
      });

      tempLines.forEach((item, index) => {
        map.getSource(`route${index}`).setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: item,
          },
        });
      });

      setLines(tempLines);

      setLng(centerLng);
      setLat(centerLat);
      setZoom(map.getZoom().toFixed(2));
    });
  }, [map]);

  const sliderController = (event, value, id) => {
    var tempLines = [];
    var centerPointFirstLine = (lines[id][0][0] + lines[id][1][0]) / 2;
    var firstLat = centerPointFirstLine + (value * 0.0119) / 2;
    var secondLat = centerPointFirstLine - (value * 0.0119) / 2;

    var firstElement = [
      [firstLat, lines[id][0][1]],
      [secondLat, lines[id][1][1]],
    ];
    var secondElemet = lines[id === 1 ? 0 : 1];

    tempLines.push(firstElement);
    id === 0 ? tempLines.push(secondElemet) : tempLines.unshift(secondElemet);
    setLines(tempLines);

    map.getSource(`route${id}`).setData({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: tempLines[id],
      },
    });
  };

  return (
    <div className="App">
      <div>
        <div className="sidebar">
          Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
          <Slider
            defaultValue={1}
            aria-labelledby="discrete-slider-small-steps"
            step={0.5}
            marks
            min={0}
            max={5}
            valueLabelDisplay="auto"
            onChangeCommitted={(event, value) => {
              sliderController(event, value, 0);
            }}
            id="firstSlider"
          />
          <Slider
            defaultValue={1}
            aria-labelledby="discrete-slider-small-steps"
            step={0.5}
            marks
            min={0}
            max={5}
            valueLabelDisplay="auto"
            onChangeCommitted={(event, value) => {
              sliderController(event, value, 1);
            }}
            id="secondSlider"
          />

        </div>
        <div className="map-container" ref={mapContainer} />
      </div>
    </div>
  );
}

export default App;
