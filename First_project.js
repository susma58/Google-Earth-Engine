var parbat = nepal.filter(ee.Filter.eq('DIST_EN', 'Parbat'));
Map.centerObject(parbat, 10);
Map.addLayer(parbat, {}, 'Parbat District');

// NDVI
var ndviCol = ee.ImageCollection('MODIS/006/MOD13Q1')
.filterDate('2001-01-01', '2025-12-31')
.filterBounds(parbat)
.select('NDVI');

// Time-series Vegetation
var ndvi = ndviCol.map(function(img){
  return img.multiply(0.0001)                       // values converting to range 0 to 1
  .copyProperties(img, ['system:time_start']);
});

// Rainfall Data (CHIRPS)
var rainfall = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY')
.filterDate('2001-01-01', '2025-12-31')
.filterBounds(parbat);

// Convert Daily to annual rainfall
var annualrain = ee.ImageCollection.fromImages(
  ee.List.sequence(2001, 2025).map(function(year){
    var start = ee.Date.fromYMD(year,1,1);
    var end = ee.Date.fromYMD(year,12,31);
    
    
    return rainfall.filterDate(start, end)
    .sum()
    .clip(parbat)
    .set('year', year)
    .set('system:time_start', start.millis());
  }));
  

// Temperature Data (MODIS LST)
var lstcol = ee.ImageCollection('MODIS/006/MOD11A2')
.select('LST_Day_1km')
.filterDate('2001-01-01', '2025-12-31')
.filterBounds(parbat);

// conversion of kelvin to celsius
var lst = lstcol.map(function(img){
  return img.multiply(0.02)
  .subtract(273.15)
  .copyProperties(img, ['system:time_start']);
});

// Annual mean NDVI
var annualndvi = ee.ImageCollection.fromImages(
  ee.List.sequence(2001, 2025).map(function(year){
    var start = ee.Date.fromYMD(year,1,1);
    var end = ee.Date.fromYMD(year,12,31);
    
    return ndvi.filterDate(start, end)
    .mean()
    .clip(parbat)
    .set('year', year)
    .set('system:time_start', start.millis());
  }));
  
// Time-series charts
// NDVI trend
var ndviChart = ui.Chart.image.series({
  imageCollection: annualndvi, 
  region: parbat, 
  reducer: ee.Reducer.mean(),
  scale: 250, 
  xProperty: 'system:time_start'
}).setOptions({
  title: 'Annual NDVI Trend (Parbat)',
  vAxis: {title: 'NDVI'},
  hAxis: {title: 'Year'}
});

print(ndviChart);


// Rainfall trend
var rainchart = ui.Chart.image.series({
  imageCollection: annualrain,
  region: parbat,
  reducer: ee.Reducer.mean(),
  scale: 5000, 
  xProperty: 'system:time_start'
}).setOptions({
  title: 'Annual Rainfall Trend (Parbat)',
  vAxis: {title: 'Rainfall (mm)'},
  hAxis: {title: 'Year'}
});

print(rainchart);


// Temperature trend
var lstChart = ui.Chart.image.series({
  imageCollection: lst,
  region: parbat,
  reducer: ee.Reducer.mean(),
  scale: 1000, 
  xProperty: 'system:time_start'
}).setOptions({
  title: 'Temperature Trend (Parbat)',
  vAxis: {title: 'Temperature (Celsius)'},
  hAxis: {title: 'Year'}
});

print(lstChart);






// Compute long-term mean NDVI (2001-2025)
var ndviMean = annualndvi.mean();

// Compute NDVI anomaly for each year
var ndviAnomaly = annualndvi.map(function(img){
  return img.subtract(ndviMean).rename('NDVI_anomaly')
            .set('year', img.get('year'))
            .set('system:time_start', img.get('system:time_start'));
});

// Chart NDVI anomaly
var ndviAnomChart = ui.Chart.image.series({
  imageCollection: ndviAnomaly,
  region: parbat,
  reducer: ee.Reducer.mean(),
  scale: 250,
  xProperty: 'system:time_start'
}).setOptions({
  title: 'Annual NDVI Anomaly (Parbat)',
  vAxis: {title: 'NDVI Anomaly'},
  hAxis: {title: 'Year'},
  lineWidth: 2,
  pointSize: 4,
  colors: ['darkblue']
});

print(ndviAnomChart);

