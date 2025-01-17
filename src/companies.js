import { companyProfiles } from "../fetch_tickers";
import './companies.scss'
import test from '../test'

companyProfiles.then(data => {
    console.log(data)
    const sorted = []
    const recommends = []
    const prices = []
    for(let i = data.length - 1; i >= 0; i--){
        if (data[i][0].name){
            sorted.push(data[i][0])
            recommends.push(data[i][1][0])
            prices.push(data[i][2])
        }
    }

    const svg = d3.select("#companies-container")
            .selectAll('.company-container')
            .data(sorted)
            .enter()
                .append("div")
                    .attr('class', 'company-container')

    const container = d3.selectAll('.company-container').data(sorted)
    container.append("div").attr("class", "company-profile")    
    container.append("div").attr("class", "company-recommend")    
    container.append("div").attr("class", "company-price")    

    
    const profile = d3.selectAll('.company-profile').data(sorted)
    profile.append('div').text(d => {return "Company: " + d.name}).attr("class", "company-name")
    profile.append('div').text(d => {return "Ticker: " + d.ticker}).attr("class", "company-ticker")
    profile.append('div').text(d => {return "Market Capitalization: " + (d.marketCapitalization).toLocaleString() + " million"}).attr("class", "company-markcap")
    profile.append('div').text(d => {return "Industry: " + d.finnhubIndustry}).attr("class", "company-industry")
    profile.append('div').text(d => {return "Exchange: " + d.exchange}).attr("class", "company-exchange")
    profile.append('div').text(d => {return "Country: " + d.country}).attr("class", "company-country")


    var margin = 20, recommendWidth = 500 ,height = 300
    var radius = Math.min(recommendWidth, height) / 2 - margin

    const new_data = recommends.map(function(d){
        if (d){
            return [
                { key: 'Strong Sell', value: d.strongSell},
                { key: 'Sell', value: d.sell},
                { key: 'Hold', value: d.hold},
                { key: 'Buy', value: d.buy},
                { key: 'Strong Buy', value: d.strongBuy},
            ]
        } else {
            return [
                { key: 'Strong Sell', value: 0},
                { key: 'Sell', value: 0},
                { key: 'Hold', value: 0},
                { key: 'Buy', value: 0},
                { key: 'Strong Buy', value: 0},
            ]
        }
    })

    var color = d3.scaleOrdinal()
        .domain(["Strong Sell", "Sell", "Hold", "Buy", "Strong Buy"])
        .range(["#C50000", "#FF4E4E", "#ffff00", "#63FF57", "#39B500"])

    var pie = d3.pie().value(d => d.value)

    var arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius)

    // bind our data to the divs. add a group to each div.
    const recommendSvg = d3.selectAll('.company-recommend')
        .data(new_data)
        .append('svg')
            .attr('width', recommendWidth)
            .attr('height', height)
            .style('padding-top', "20px")
            .style("color", "white")
        .append('g')
            .attr('transform', `translate(${recommendWidth / 3},${height / 2})`)
            .attr('class', "pie-chart")

    var span = d3.select('body').append('span')
        .attr("class", "tooltip-donut")
        .style("opacity", 0)

    // draw the pie chart in each group
    // by creating one path for each slice
    recommendSvg.selectAll('path')
        .data(d => pie(d))
        .join('path')
            .attr('d', arc)
            .attr('fill', d => color(d.data.key))
            .attr('stroke', 'black')
            .attr('stroke-width', '1px')
            .attr('opacity', 0.7)
            .on("mouseover", function(d) {
                d3.select(event.currentTarget).transition()
                    .duration("50")
                    .attr("opacity", ".85")
                span.transition().duration(50).style("opacity", "1")
                let displayText = d.data.key + ": " + d.data.value
                span.html(displayText)
                    .style('left', (d3.event.pageX + 5) + "px")
                    .style('top', (d3.event.pageY - 5) + "px")
            })
            .on("mouseout", function(d){
                d3.select(event.currentTarget).transition()
                    .duration("50")
                    .attr("opacity", "1")
                span.transition().duration(50).style("opacity", "0")
            })

    recommendSvg.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 60)
        .attr("fill", "#092543");


    const legendG = recommendSvg.selectAll('.legend')
        .data(d => d)
        .enter().append("g")
        .attr("transform", function(d,i){
            return "translate(" + (recommendWidth - 340) + "," + ((i * 2) * 10) + ")";
        })
        .attr("class", "legend")
        .style("color", "white")

        
    legendG.append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", function(d, i){
            return color(i)
        })
        .attr("class", "legend-box")

    legendG.append('text')
        .text(d => d.key)
        .attr('x', 10)
        .attr('y', 11)
        .style("fill", "white")
        .attr("class", "legend-text")

    d3.selectAll(".company-price")
        .data(prices)
        .each(lineChart);

    
    function lineChart({data}){
        const priceMargin = {top: 10, right: 60, bottom: 30, left: 60};
        const priceWidth = 1000 - priceMargin.left - priceMargin.right;  
        const priceHeight = 400 - priceMargin.top - priceMargin.bottom;
        
        const svg = d3.select(this)
            .append('svg')
                .attr("width", priceWidth + priceMargin.left + priceMargin.right)
                .attr("height", priceHeight + priceMargin.top + priceMargin.bottom)
        const bounds = svg
            .append("g")
                .attr("transform", `translate(${priceMargin.left},${priceMargin.top})`);
        
        const yAccessor = (d) => d.close
        const parseDate = d3.timeParse('%Y-%m-%dT%H:%M:%S%Z')
        const xAccessor = (d) => parseDate(d.date)

        var highPrice  
        var lowPrice

        function findPrice(data){
            let low = data[0].close
            let high = data[0].close
            data.forEach(price => {
                if (price.close < low) low = price.close
                if (price.close > high) high = price.close
            })
            highPrice = high
            lowPrice = low
        }
        findPrice(data)

        const x = d3.scaleTime()
            .domain(d3.extent(data, d => parseDate(d.date)))
            .range([0, priceWidth]);

        const y = d3.scaleLinear()
            .domain([lowPrice - 0.5, highPrice + 0.5])
            .range([priceHeight, 0]);

        const line = d3.line()
            .x(d => x(parseDate(d.date)))
            .y(d => y(d.close))

        if (data[0].close < data[data.length - 1].close){
            svg.append("path")
                .attr("fill", "none")
                .attr("stroke", "rgba(255, 31, 31)")
                .attr('d', line(data))
                .style("stroke-width", "2px")
        } else {
            svg.append("path")
                .attr("fill", "none")
                .attr("stroke", "rgba(19, 255, 19)")
                .attr('d', line(data))
                .style("stroke-width", "2px")
        }

        svg.append('g')
            .call(d3.axisLeft(y))
            .attr("class", "d3-axes")

        svg.append('g')
            .attr("transform", `translate(0, ${priceHeight})`)
            .call(d3.axisBottom(x))
            .attr("class", "d3-axes")


        //set up mouseover interaction 

        const formatValue = d3.format(",.2f"),
            formatCurrency = function(d) { return "$" + formatValue(d); };

        const listeningRect = svg.append("rect")
            .attr("class", "listening-rect")
            .attr("width", priceWidth)
            .attr("height", priceHeight)
            .on("mousemove", onMouseMove)
            .on("mouseleave", onMouseLeave);

        const xAxisLine = svg.append('g')
            .append("rect")
            .attr("class", "dotted")
            .attr("stroke-width", "1px")
            .attr("width", ".5px")
            .attr('fill', "white")
            .attr("height", priceHeight);

        // Add a circle under our tooltip, right over the “hovered” point
        
        const tooltip = d3.select("#tooltip"); 
        const tooltipCircle = svg
            .append("circle")
            .attr("class", "tooltip-circle")
            .attr("r", 4)
            .attr("stroke", "#af9358")
            .attr("fill", "white")
            .attr("stroke-width", 2)
            .style("opacity", 0);

        function onMouseMove(){
            const mousePosition = d3.mouse(this)
            const hoveredDate = x.invert(mousePosition[0])

            const getDistanceFromHoveredDate = (d) => Math.abs(xAccessor(d) - hoveredDate);

            const closetIndex = d3.scan(
                data, (a,b) => getDistanceFromHoveredDate(a) - getDistanceFromHoveredDate(b));

            const closestDataPoint = data[closetIndex]
            
            const closestXValue = xAccessor(closestDataPoint);
            const closestYValue = yAccessor(closestDataPoint);

            const formatDate = d3.timeFormat("%A %B %-d, %Y");
            
            let displayText = formatDate(closestXValue) + ": " + formatCurrency(closestYValue)
            tooltip.html(displayText)
                    .style('left', (d3.event.pageX - 20) + "px")
                    .style('top', (d3.event.pageY) + "px")
            tooltip.select("#date").text(formatDate(closestXValue));
            tooltip.select("#price").html(formatCurrency(closestYValue));
            
            tooltip.style("opacity", 1);
            
            tooltipCircle
                .attr("cx", x(closestXValue))
                .attr("cy", y(closestYValue))
                .style("opacity", 1)

            xAxisLine.attr("x", x(closestXValue));
        }

        function onMouseLeave() {
            tooltip.style("opacity", 0);
            tooltipCircle.style("opacity", 0);
        }
    }
})