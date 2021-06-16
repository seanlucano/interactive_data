const bestFitToggle = document.querySelector("#bestFitToggle");
const residualsToggle = document.querySelector("#residualsToggle");
const userLineToggle = document.querySelector("#userLineToggle");
const userLineResidualsToggle = document.querySelector("#userLineResidualsToggle");

// set dimentions and margins of the plot 
const margin = { top: 30, right: 30, bottom: 30, left: 30 },
  width = 600 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

// apend the svg object to the page
const svg = d3.select("#plot")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
      .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");   

//add a invisible rectangle to the g element that can be targeted for pointer events.
svg.append('rect')
    .attr("fill", "none")
    .style("pointer-events", "all")
    .attr('width', width)
    .attr('height', height)
    .attr("id", "target");

//read in data
d3.csv("https://raw.githubusercontent.com/seanlucano/interactive_data/main/test.csv").then(data => {
  //parse string data to numeric
  data.forEach(d => {
      d.yValue = +d.yValue;
      d.xValue = +d.xValue;
  });
  

  // Create x scale
  let x = d3.scaleLinear()
    .domain([-10, 15])
    .range([0, width]);
  // append x axis
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  // Create y scale
  let y = d3.scaleLinear()
    .domain([-15, 15])
    .range([height, 0]);
  //append y axis
  svg.append("g")
    .call(d3.axisLeft(y));

  //caclulate regression line data 
  const regression = d3.regressionLinear()  // store output of function generator
    .x(d => d.xValue)                       // set the x and y accessors 
    .y(d => d.yValue);
  const regressionLine = regression(data);  //pass the data into the new function
  
  const residualsGroup = svg.append('g')
      .attr("id", "residualsGroup");

  const userLineresidualsGroup = svg.append('g')
  .attr("id", "userLineResidualsGroup");
  
  // create points group 
  const pointsGroup = svg.append('g')
      .attr("id", "pointsGroup");

  // initialize best fit line data
  const bestFitLineData = [{x: regressionLine[0][0], y: regressionLine[0][1], xx: regressionLine[1][0], yy: regressionLine[1][1]}];

  // initialize userLine data
  const userLineData = [{x: 0, y: 0, xx: 0, yy: 0}];

  // initialize empty dragline selection 
  let userLine;

  // MAIN LOGIC
  renderPoints();
  bestFitToggle.addEventListener('change', (event) => renderBestFitLine() );
  residualsToggle.addEventListener('change', (event) => renderResiduals() );
  userLineToggle.addEventListener('change', (event) => renderUserLine() );
  userLineResidualsToggle.addEventListener('change', (event) => renderUserLineResiduals() );


  // FUNTIONS
  function renderPoints() {
    pointsGroup
      .selectAll("dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", function (d) { return x(d.xValue); })
      .attr("cy", function (d) { return y(d.yValue); })
      .attr("r", 5)
      .style("fill", "#5c42ee");
  }
  
  
  function renderBestFitLine() {
    
    const bestFitLine = svg.selectAll("#regressionLine")
      .data(bestFitLineData).join("line")
        .attr("x1", d => x(d.x))
        .attr("y1", d => y(d.y))
        .attr("x2", d => x(d.xx))
        .attr("y2", d => y(d.yy))
        .attr("stroke-width", 2)
        .attr("stroke", "black")
        .attr("id", "regressionLine")
        .attr("stroke-opacity", .6);
    console.log(bestFitLineData);
      
    if (!bestFitToggle.checked) {
              bestFitLine
              .classed('hidden', true);
              
            } else if (bestFitToggle.checked) {
              bestFitLine
              .classed('hidden', false); 
        }
      
  }

  function renderUserLine() {
    userLine = svg.selectAll("#userLine")
      .data(userLineData).join("line")
        .attr("x1", d => x(d.x))
        .attr("y1", d => y(d.y))
        .attr("x2", d => x(d.xx))
        .attr("y2", d => y(d.yy))
        .attr("stroke-width", 2)
        .attr("stroke", "red")
        .attr("id", "userLine")
        .attr("stroke-opacity", .6);

    if (!userLineToggle.checked) {
      userLine
      .classed('hidden', true);
      
    } else if (userLineToggle.checked) {
      userLine
      .classed('hidden', false); 
    }
  }

  function renderResiduals() {
    const residuals = residualsGroup.selectAll("line")
      .data(data, d => d.key)
      .join(
        enter => enter.append("line")
            .attr("x1", d => x(d.xValue))
            .attr("y1", d => y(d.yValue))
            .attr("x2", d => x(d.xValue))
            .attr("y2", d => y(d.yValue))
            .attr("stroke", "grey")
            .attr("stroke-dasharray","2,2")
            .attr("class", "residual")
            .call(enter => enter.transition().duration(500)
            .attr("y2", d => y(regressionLine.predict(d.xValue)))
        ),
        
        update => update
          .call(update => update.transition().duration(500)
              .attr("y2", d => y(regressionLine.predict(d.xValue)))
          ),
        
        exit => exit
          .remove()
      );

      // Check the residuals toggle to render hidden or visible
      if (!residualsToggle.checked) {
        residuals
        .classed('hidden', true);
      } else if (residualsToggle.checked) {
        residuals
        .classed('hidden', false);
      }
  }

  function renderUserLineResiduals() {
    const residuals = userLineResidualsGroup.selectAll("line")
      .data(data, d => d.key)
      .join(
        enter => enter.append("line")
            .attr("x1", d => x(d.xValue))
            .attr("y1", d => y(d.yValue))
            .attr("x2", d => x(d.xValue))
            .attr("y2", d => y(d.yValue))
            .attr("stroke", "pink")
            .attr("stroke-dasharray","2,2")
            .attr("class", "userResidual")
            .call(enter => enter.transition().duration(500)
            .attr("y2", d => y(0))
        ),
        
        update => update
          .call(update => update.transition().duration(500)
              .attr("y2", d => y(0))
          ),
        
        exit => exit
          .remove()
      );

      // Check the residuals toggle to render hidden or visible
      if (!userLineResidualsToggle.checked) {
        residuals
        .classed('hidden', true);
      } else if (userLineResidualsToggle.checked) {
        residuals
        .classed('hidden', false);
      }
  }
  
  // LINE DRAW LOGIC AND FUNCTIONS
  
  
  
  // create lineDraw drag behavior
  const lineDraw = d3.drag()
    .on("start", function (event) {
      let coordsStart = d3.pointer(event, svg.node());
      userLineData[0].x = x.invert(coordsStart[0]);
      userLineData[0].y = y.invert(coordsStart[1]);
      userLineData[0].xx = x.invert(coordsStart[0]);
      userLineData[0].yy = y.invert(coordsStart[1]);
      console.log(userLineData);
      renderUserLine();
      })
    .on("drag", function (event) {
      let coordsDrag = d3.pointer(event, svg.node());  //update the line and dot positions with mouse move
      userLineData[0].xx = x.invert(coordsDrag[0]);
      userLineData[0].yy = y.invert(coordsDrag[1]);
      console.log(userLineData);
      renderUserLine();
      })
    .on("end", function (d) {
      //maybe create handles on each end of the line for future moving?
    });
    d3.select("#target").call(lineDraw);
});


