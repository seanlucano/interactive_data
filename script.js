// set dimentions and margins of the plot 
const margin = { top: 30, right: 30, bottom: 30, left: 30 },
  width = 600 - margin.left - margin.right,
  height = 400 - margin.top - margin.bottom;

// apply dimensions to svg '#plot" and add a group element
const svg = d3.select("#plot")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//add a target on plot to accept click events
const target = svg.append('rect')
    .attr("fill", "none")
    .style("pointer-events", "all")
    .attr('width', width)
    .attr('height', height)
    .attr("id", "target");

// load the dataset - beginning of main callback
d3.csv("https://raw.githubusercontent.com/seanlucano/interactive_data/main/MsftWlmrt.csv").then(data => {
    //parse string data to numeric
    data.forEach(d => {
        d.MsftReturn = +d.MsftReturn;
        d.WmtReturn = +d.WmtReturn;
    });
  
  // x scale
    let x = d3.scaleLinear()
      .domain([-10, 15])
      .range([0, width]);
    
    // x axis
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

    // y scale
    let y = d3.scaleLinear()
      .domain([-15, 15])
      .range([height, 0]);
    
    // y axis 
    svg.append("g")
      .call(d3.axisLeft(y));
  
  //caclulate regression data 
    const regression = d3.regressionLinear() // create a function generator
      .x(d => d.WmtReturn)   // set the x and y accessors (what columns to find data)
      .y(d => d.MsftReturn);
    let regressionLine = regression(data); //pass the data into the new function 

    // append regression line
    svg.append("line")
      .attr("x1", x(regressionLine[0][0]))
      .attr("y1", y(regressionLine[0][1]))
      .attr("x2", x(regressionLine[1][0]))
      .attr("y2", y(regressionLine[1][1]))
      .attr("stroke-width", 2)
      .attr("stroke", "black")
      .attr("id", "regressionLine")
      .attr("stroke-opacity", .8);

    //add r value to the DOM
    d3.select("#R")
      .html(`R = ${Math.sqrt(regressionLine.rSquared).toFixed(3)}`);


    //select residual checkbox and add event lister for change calling the updateResiduals function
    const residualsToggle = document.querySelector('#residualsToggle');
    residualsToggle.addEventListener('change', (event) => {
      //console.log(residualsToggle.checked);
      updateResiduals();
    });

    // create 'points' group element
    const points = svg.append('g')
        .attr("id", "points");
    //render circles in 'points' group element
    renderCircles();

    // add points on click 
    target.on("click", function (event) {
      let coordsStart = d3.pointer(event, svg.node());
      let cx = coordsStart[0];
      let cy = coordsStart[1];
      
      let newData = {               //store click coords
        WmtReturn: x.invert(cx),
        MsftReturn: y.invert(cy)
      }
      
      data.push(newData);   //add new point coords to data
      renderCircles();      //render circles with updated data   
      regressionUpdate();   //update all regression logic
      updateResiduals();
    });

    

    // render circles to plot
    function renderCircles() {
      updateResiduals(); //reder residuals first so they are behind the circles
      
      const circles = points.selectAll("circle")
        .data(data);

      circles   
        .join("circle")
          .attr("cx", function (d) { return x(d.WmtReturn); })
          .attr("cy", function (d) { return y(d.MsftReturn); })
          //.attr("id", function (d,i) {return i;})
          .attr("r", 4)
          .style("fill", "#5c42ee")
          .style('fill-opacity', '95%');

      // remove points on click
      currentCircles = d3.selectAll("circle")
        .on("click", function removePoint(event, d) {
          const e = currentCircles.nodes();
          const i = e.indexOf(this);
          console.log(i);
          data.splice(i,1);
          renderCircles();
          regressionUpdate();
          updateResiduals();
        });          
          
    }

    //update residuals
    function updateResiduals() {
      const residuals = points.selectAll("line")
        .data(data)
        .join("line")
          .attr("x1", d => x(d.WmtReturn))
          .attr("y1", d => y(d.MsftReturn))
          .attr("x2", d => x(d.WmtReturn))
          .attr("y2", d => y(regressionLine.predict(d.WmtReturn)))
          .attr("stroke", "grey")
          .attr("class", "residual")
          ;
        
        // Check the residuals toggle to render hidden or visible
        if (!residualsToggle.checked) {
          points.selectAll('line')
            .classed('hidden', true);
        } else if (residualsToggle.checked) {
          points.selectAll('line')
          .classed('hidden', false);
        }
        
    }

    // update regression data
    function regressionUpdate() {
  
        regressionLine = regression(data); //calculate new regression line data

        d3.select("#regressionLine") //update the regression line with new data
          .transition()
          .duration(500)
          .attr("x1", x(regressionLine[0][0]))
          .attr("y1", y(regressionLine[0][1]))
          .attr("x2", x(regressionLine[1][0]))
          .attr("y2", y(regressionLine[1][1]));

        d3.select("#R") // update R value text node
        .html(`R = ${Math.sqrt(regressionLine.rSquared).toFixed(3)}`);
      }
});