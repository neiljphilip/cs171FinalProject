
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
    var financeDayParser = d3.timeParse("%b %d, %Y");
    var columns = ["Coin", "Date", "Open", "High", "Low", "Close", "Volume", "MarketCap"];
    var cryptoFinanceData = d3.csvParseRows(financialData).map(function(row, rowI) {
        return row.map(function(value, colI) {
            if (rowI !== 0 && colI >= 2 && colI <= 5) {
                return +value;
            } else if (colI > 5) {
                return +(value.replace(/,/g, ''))
            } else if (colI === 1) {
                return financeDayParser(value);
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
    var FinanceDashboardEventHandler = {};
    var financeTimeline = new FinanceTimeline("finance-timeline", cryptoFinanceData, FinanceDashboardEventHandler);

    d3.select('#coin-select').on('change', function() {
        var coin = d3.select(this).property("value");
        financeTimeline.onCoinChanged(coin);
    });

    d3.select('#view-select').on('change', function() {
        var view = d3.select(this).property("value");
        financeTimeline.onViewChanged(view);
    });
    /* Bind event handlers */

    /** Dashboard 3 **/

    /* Clean data */
    // TODO

    /* Create visualization instances */

    /* Bind event handlers */
}