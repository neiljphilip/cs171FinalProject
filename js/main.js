/* Parsers */
var dateParser = d3.timeParse("%b %d, %Y");

/* Load data */
queue()
    .defer(d3.text, "data/cryptoFinancialData.csv")
    .await(createVis);

function createVis(error, financialData) {
    if (error) { console.log(error); }

    /*** Create dashboards ***/

    /** Dashboard 1 **/

    /* Clean data */
    // TODO

    /* Create visualization instances */
    // e.g. var exampleVis = new ExampleVis("example-vis", data, eventHandler);

    /* Bind event handlers */

    /** Dashboard 2 - Financial Data **/

    /* Clean data */
    var columns = ["Coin", "Date", "Open", "High", "Low", "Close", "Volume", "MarketCap"];
    var cryptoFinanceData = d3.csvParseRows(financialData).map(function(row, rowI) {
        return row.map(function(value, colI) {
            if (rowI !== 0 && colI >= 2 && colI <= 5) {
                return +value;
            } else if (colI > 5) {
                return +(value.replace(/,/g, ''))
            } else if (colI === 1) {
                return dateParser(value);
            }
            return value;
        });
    });
    cryptoFinanceData = cryptoFinanceData.map(function(d) {
        var dayObj = {};
       for (let i = 0; i < d.length; i++) {
           dayObj[columns[i]] = d[i];
       }
       return dayObj;
    });
    // Get rid of header row
    cryptoFinanceData.shift();
    cryptoFinanceData.forEach(function(d) {
       d.Average = (d.High + d.Low) / 2;
    });

    // Get the percentage of the day's total volume transaction for each coin
    var financeByDate = d3.nest()
        .key(function(d) { return d.Date; })
        .rollup(function(d) {
            var totalVolume = d3.sum(d, function(v) { return v.Volume; });
            var data = {};
            d.forEach(function(v) {
                v.VolumePercent = v.Volume / totalVolume;
                data[v.Coin] = v;
            });
            return data;
        })
        .object(cryptoFinanceData);

    cryptoFinanceData.forEach(function(d) {
        d.VolumePercent = financeByDate[d.Date][d.Coin].VolumePercent;
    });
    console.log(cryptoFinanceData);

    /* Create visualization instances */
    var financeTimeline = new FinanceTimeline("finance-timeline", cryptoFinanceData);

    /* Bind event handlers */

    /** Dashboard 3 **/

    /* Clean data */
    // Cleaned in Excel.
    queue()
        .defer(d3.json,"data/world-110m.json")
        .defer(d3.tsv, "data/world-110m-country-names.tsv")
        .defer(d3.csv, "data/attitude.csv")
        .defer(d3.csv, "data/legality.csv")
        .await(function(error, mapTopJson, worldTsv, data1, data2) {
            //var regChoropleth = new Choropleth("choropleth", data1, data2, mapTopJson);
           // var dragGlobe = new animatedGlobe("choropleth", data1, data2, "data/countries.geo.json");
            console.log(data1);
            var globe = new dragGlobe("choropleth", mapTopJson, worldTsv, data1, data2);
        });

    /* Create visualization instances */


    /* Bind event handlers */
}