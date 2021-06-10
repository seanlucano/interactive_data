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
async function getData(url) {
  
  const data = await d3.csv(url)
    //.then(data => {
    //      data.yValue = +data.yValue;
    //      data.xValue = +data.xValue;
    //  });

  return data;
}

const url = "https://raw.githubusercontent.com/seanlucano/interactive_data/main/test.csv";

getData(url).then(d => {
  return d
});


d3.csv("https://raw.githubusercontent.com/seanlucano/interactive_data/main/test.csv").then(data => {
    //parse string data to numeric
    data.forEach(d => {
        d.yValue = +d.yValue;
        d.xValue = +d.xValue;
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
      .x(d => d.xValue)   // set the x and y accessors (what columns to find data)
      .y(d => d.yValue);
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

    // create residuals group 
    const residualsGroup = svg.append('g')
        .attr("id", "residualsGroup");

    // create points group 
    const pointsGroup = svg.append('g')
        .attr("id", "pointsGroup");

    //select residual checkbox in DOM and add event lister for any change, which will re-render the residuals 
    const residualsToggle = document.querySelector('#residualsToggle');
    residualsToggle.addEventListener('change', (event) => {
    updateResiduals();
    });

    // add event lister to "target" element to add new plot points on click
    target.on("click", function (event) {
      let coordsStart = d3.pointer(event, svg.node());
      let cx = coordsStart[0];
      let cy = coordsStart[1];
      
      let newData = {               //store click coords
        xValue: x.invert(cx),
        yValue: y.invert(cy),
        key: Math.random()
      }
      
      data.push(newData);   //add new point coords to data
      //console.log(newData);
      updatePlot();
    });
    
    //initial render of all data elements
    updatePlot();
    

    //***FUNCTIONS***

    //updates the entire plot
    function updatePlot() {
      updateRegression();
      updateResiduals();
      updateCircles();
      //console.log(data);
    }
    
    // render circles to plot
    function updateCircles() {
      
      const points = pointsGroup.selectAll("circle")
        .data(data, d => d.key);
        
      points   
        .join(
          enter => enter.append("circle")
              .attr("cx", d => x(d.xValue))
              .attr("cy", d => y(d.yValue))
              //.attr("id", function (d,i) {return i;})
              .attr("r", 1)
              .style("fill", "#5c42ee")
              .style('fill-opacity', '95%')
            .call(enter => enter
              .transition()
              .duration(500)
                .attr("r", 4)
            ),
          update => update
            // .call(update => update
            //   .transition()
            //   .duration(500)
              .attr("cx", d => x(d.xValue))
              .attr("cy", d => y(d.yValue))
            // )
            ,
          exit => exit
            .call(exit => exit
              .transition()
              .duration(500)
                .attr("r",0)
              .remove()
            )
        );
        
      // add click event listerner to all points, remove data points on click and update all data
      const currentPoints = d3.selectAll("circle")
        .on("click", function removePoint(event, d) {
          const i = data.indexOf(d);
          data.splice(i,1);
          updatePlot();
          
        });          
          
    }

    //update residuals
    function updateResiduals() {
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

    // update regression data
    function updateRegression() {

        regressionLine = regression(data); //calculate new regression line data
        //console.log(regressionLine)
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