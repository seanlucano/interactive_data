// DOM SELECTORS
const bestFitToggle = document.querySelector("#bestFitToggle");
const residualsToggle = document.querySelector("#residualsToggle");
const userLineToggle = document.querySelector("#userLineToggle");
const userLineResidualsToggle = document.querySelector("#userLineResidualsToggle");
const bestFitText = document.querySelector("#bestFit");
const userLineEquation = document.querySelector("#userLineEquation");
const userLineM = document.querySelector("#userLineM");
const userLineB = document.querySelector("#userLineB");

// const submitBtn = document.querySelector("#submit");
const compareBtn = document.querySelector("#compare");
const calculateBtn = document.querySelector("#calculate");
const showBtn = document.querySelector("#show");
const nextBtn = document.querySelector('#next');
const startOverBtn = document.querySelector('#startOver');


const userLineControls = document.querySelector("#user");
const bestFitLineControls = document.querySelector("#bestFit");
const dialogue = document.querySelector("#dialogue");
const prompt = document.querySelector("#prompt");


// STYLE VARS
const userLineColor = '#9d23c5';
const bestFitLineColor = '#5a5c66';
const residualStroke = 2;
const lineStroke = 2;
const dashArray = '2,2';

//SUM OF SQUARED NUMBER INITIALIZTION
let sumOfSquaredResiduals = '';
let residualsArray = [];

// GLOBAL VARIABLE FOR USERLINE SELECTION 
let userLine;
let bestFitLine;

// PLOT DIMENSIONS
const margin = { top: 30, right: 30, bottom: 30, left: 30 },
  width = 600 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

// SVG
const svg = d3.select("#plot")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
      .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");   

//TARGET
svg.append('rect')
    .attr("fill", "none")
    .style("pointer-events", "all")
    .attr('width', width)
    .attr('height', height)
    .attr("id", "target");

//POINT DATA
d3.csv("https://raw.githubusercontent.com/seanlucano/interactive_data/main/test.csv").then(data => {
  //parse string data to numeric
  data.forEach(d => {
      d.yValue = +d.yValue;
      d.xValue = +d.xValue;
  });
  

  // SCALES
  let x = d3.scaleLinear()
    .domain([-10, 15])
    .range([0, width]);
  
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  
  let y = d3.scaleLinear()
    .domain([-15, 15])
    .range([height, 0]);
  
  svg.append("g")
    .call(d3.axisLeft(y));


  // ADDITIONAL DOM GROUP ELEMENTS
  const residualsGroup = svg.append('g')
      .attr("id", "residualsGroup");

  const userLineResidualsGroup = svg.append('g')
  .attr("id", "userLineResidualsGroup");
   
  const pointsGroup = svg.append('g')
      .attr("id", "pointsGroup");


  //CHECK BOX EVENT LISTERNERS
  bestFitToggle.addEventListener('change', (event) => renderBestFitLine() );
  residualsToggle.addEventListener('change', (event) => renderResiduals() );
  // userLineToggle.addEventListener('change', (event) => renderUserLine() );
  // userLineResidualsToggle.addEventListener('change', (event) => renderUserLineResiduals() );

  //disable residuals if best fit line is unchecked
  bestFitToggle.addEventListener('change', (event) => {
    if(!bestFitToggle.checked) {
      residualsToggle.disabled = true;
      residualsToggle.checked = false;
      renderResiduals();
    } else if(bestFitToggle.checked) {
      residualsToggle.disabled = false;
    }
  });

  // userLineToggle.addEventListener('change', (event) => {
  //   if(!userLineToggle.checked) {
  //     userLineResidualsToggle.disabled = true;
  //     userLineResidualsToggle.checked = false;
  //     renderUserLineResiduals();
  //   } else if(userLineToggle.checked) {
  //     userLineResidualsToggle.disabled = false;
  //   }
  // });

//USER NAVIGATION EVENTS

//NEXT
nextBtn.addEventListener("click", (event)=> {
  dialogue.innerHTML = 
    "On the chart, we're now seeing the length of each residual. <br><br>It turns out that this best fit line was calculated by generating a line that yeilds the smallest sum total of all residual lengths possible for this plot!<br><br>But wait...you may notice that residuals above the line are <strong>positive</strong>, and below are <strong>negative</strong>.  So how do we find a sum of the lengths of all residuals?";

  prompt.innerHTML = 
    "Click 'Show me' to see how stats nerds deal with the negative and positive values";
  residualsToggle.checked = true;
  nextBtn.classList.add("removed");
  showBtn.classList.remove("removed");
  renderResiduals();
  renderResidualLengths();
});

//SHOW ME
showBtn.addEventListener("click", (event)=> {
  dialogue.innerHTML = 
    "<br><br>Statisticians solve this little dilema by squaring each residual so all values are positive.  For this line, the sum of squared residuals calculation would look like this:<br><br> -8.4^2 + 9.1^2 + 6.1^2 + -6.9^2 + 1.4^2 + -1.3^2";

  prompt.innerHTML = 
    "Click 'calculate' to find the sum of the squared residuals for the best fit line.";
  residualsToggle.checked = true;
  showBtn.classList.add("removed");
  calculateBtn.classList.remove("removed");
  renderResiduals();
  renderResidualLengths();

});

//COMPARE
compareBtn.addEventListener("click", (event) => {
});

//CALCULATE
calculateBtn.addEventListener("click", (event)=> {
  
  residualsToggle.checked = true;
  // calculateBtn.classList.add("removed");
  pushResiduals();
  sumOfSquaredResiduals = sumOfSquares(residualsArray);
  console.log(sumOfSquaredResiduals);
  calculateBtn.classList.add("removed");
  compareBtn.classList.remove("removed");

  dialogue.innerHTML = 
    `The sum of the squared residuals for the best fit line is: <strong>${sumOfSquaredResiduals.toFixed(2)}</strong>.<br><br>In fact, this best fit line is actually called (drumroll....) the <strong>least squares line</strong>, because it represents a line that generates the smallest possible sum of squared residuals.`

  prompt.innerHTML = 
    "How does this compare to your line?  Click 'compare' to find out!";

  

});

//START OVER
startOverBtn.addEventListener("click", (event) => {
  window.location.reload();
});

  //REGRESSION DATA
  const regression = d3.regressionLinear()  // store output of function generator
    .x(d => d.xValue)                       // set the x and y accessors 
    .y(d => d.yValue);
  const regressionLine = regression(data);  //pass the data into the new function

  // LINE DATA OBJECTS
  const bestFitLineData = {
    x: regressionLine[0][0], 
    y: regressionLine[0][1], 
    xx: regressionLine[1][0], 
    yy: regressionLine[1][1],

    slope: function() { 
      this.m = (this.yy - this.y)/(this.xx - this.x);
      return this.m;
    },
    
    yIntercept: function () {
      this.b = this.y - (this.m * this.x)
      return this.b;
    },
  };
  bestFitLineData.slope();
  bestFitLineData.yIntercept();

  const userLineData = {
    x: 0, 
    y: 0, 
    xx: 0, 
    yy: 0,
    
    slope: function() { 
      this.m = (this.yy - this.y)/(this.xx - this.x);
      return this.m;
    },
    
    yIntercept: function () {
      this.b = this.y - (this.m * this.x)
      return this.b;
    },
    
    // predict: function(xVal) {
    //   let yVal = (this.m * xVal) - this.b;
    //   return yVal;
    // }
  };

  

// INITIAL PLOT
 renderPoints();
 renderBestFitLine();
  
 // USER NAV FUNCTIONS
  function sumOfSquares(array) {
    var sum = 0,
        i = array.length;
    while (i--) {
      sum += Math.pow(array[i], 2);
    }return sum;
  }


  // DEFINE LINEDRAW BEHVIOR
  const lineDraw = d3.drag()
    .on("start", function (event) {
      let coordsStart = d3.pointer(event, svg.node());
      userLineData.x = x.invert(coordsStart[0]);
      userLineData.y = y.invert(coordsStart[1]);
      userLineData.xx = x.invert(coordsStart[0]);
      userLineData.yy = y.invert(coordsStart[1]);
      renderUserLine();
      })
    .on("drag", function (event) {
      let coordsDrag = d3.pointer(event, svg.node());  //update the line and dot positions with mouse move
      userLineData.xx = x.invert(coordsDrag[0]);
      userLineData.yy = y.invert(coordsDrag[1]);
      userLineData.slope();
      userLineData.yIntercept();
      renderUserLine();
      //renderUserLineResiduals();
      
      })
    .on("end", function (d) {
      let coordsDrag = d3.pointer(event, svg.node());  //update the line and dot positions with mouse move
      
    });
    // add line draw behavior to plot
    d3.select("#target").call(lineDraw);


  // RENDER FUNTIONS
  
  function renderPoints() {
    pointsGroup
      .selectAll("dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", function (d) { return x(d.xValue); })
      .attr("cy", function (d) { return y(d.yValue); })
      .attr("r", 5)
      .style("fill", bestFitLineColor)
      ;
  }
  
  
  function renderBestFitLine() {
    bestFitLine = svg.selectAll("#regressionLine")
      .data([bestFitLineData]).join("line")
        .attr("x1", d => x(d.x))
        .attr("y1", d => y(d.y))
        .attr("x2", d => x(d.xx))
        .attr("y2", d => y(d.yy))
        .attr("stroke-width", lineStroke)
        .attr("stroke", bestFitLineColor)
        .attr("id", "regressionLine")
        ;

        let slope = bestFitLineData.m
        let yIntercept = bestFitLineData.b
        slope = slope.toFixed(2);
        yIntercept = yIntercept.toFixed(2);
        bestFitLineM.innerHTML = `${slope}`;
        bestFitLineB.innerHTML = `${yIntercept}`;
      
    if (!bestFitToggle.checked) {
          bestFitLine
          .classed('hidden', true);
          bestFitLineEquation.classList.add('hidden');
          
        } else if (bestFitToggle.checked) {
          bestFitLine
          .classed('hidden', false); 
          bestFitLineEquation.classList.remove('hidden');
    } 
  }

  function renderUserLine() {
    userLine = svg.selectAll("#userLine")
      .data([userLineData]).join("line")
        .attr("x1", d => x(d.x))
        .attr("y1", d => y(d.y))
        .attr("x2", d => x(d.xx))
        .attr("y2", d => y(d.yy))
        .attr("stroke-width", lineStroke)
        .attr("stroke", userLineColor)
        .attr("id", "userLine")
        ;

    let slope = userLineData.m
    let yIntercept = userLineData.b
    slope = slope.toFixed(2);
    yIntercept = yIntercept.toFixed(2);
    userLineM.innerHTML = `${slope}`;
    userLineB.innerHTML = `${yIntercept}`;

    // if (!userLineToggle.checked) {
    //   userLine.classed('hidden', true);
    //   userLineEquation.classList.add('hidden');
      
    // } else if (userLineToggle.checked) {
    //   userLine.classed('hidden', false); 
    //   userLineEquation.classList.remove('hidden'); 
    // }
  }



  function renderResiduals() {
    const residuals = residualsGroup.selectAll("line")
      .data(data, d => d.key)
      .join("line")
          .attr("x1", d => x(d.xValue))
          .attr("y1", d => y(d.yValue))
          .attr("x2", d => x(d.xValue))
          .attr("y2", d => y(regressionLine.predict(d.xValue)))
          .attr("stroke", bestFitLineColor)
          .attr("stroke-width",residualStroke)
          .attr("stroke-dasharray",dashArray)
          .attr("class", "residual")
          ;

      // Check the residuals toggle to render hidden or visible
      if (!residualsToggle.checked) {
        residualsGroup
        .classed('hidden', true);
      } else if (residualsToggle.checked) {
        residualsGroup
        .classed('hidden', false);
      }
      
      // make everything easier to see!
      //focusGraphics();
  }

  function renderResidualLengths() {
    const residualLengths = residualsGroup.selectAll("text")
      .data(data, d => d.key)
      .join("text")
          .text(d => (d.yValue - regressionLine.predict(d.xValue)).toFixed(1))
          .attr("class","resLength")
          .attr("x", d => x(d.xValue)-25)
          .attr("y", d => y((d.yValue + regressionLine.predict(d.xValue))/2))
          ;
  }

  function pushResiduals() {
    console.log(data);
    residualsArray = data.map(d => {
      return (d.yValue - regressionLine.predict(d.xValue));
    });
    console.log(residualsArray);
  }

  function renderUserLineResiduals() {
    const residuals = userLineResidualsGroup.selectAll("line")
      .data(data, d => d.key)
      .join("line")
          .attr("x1", d => x(d.xValue))
          .attr("y1", d => y(d.yValue))
          .attr("x2", d => x(d.xValue))
          .attr("y2", d => y((userLineData.m * d.xValue) + userLineData.b))
          .attr("stroke", userLineColor)
          .attr("stroke-dasharray",dashArray)
          .attr("class", "userResidual")
          .attr("stroke-width",residualStroke)
          ;
    
    const residualLengths = userLineResidualsGroup.selectAll("text")
      .data(data, d => d.key)
      .join("text")
          .text(d => (d.yValue - ((userLineData.m * d.xValue) + userLineData.b)).toFixed(1))
          .attr("class","resLength")
          .attr("x", d => x(d.xValue)+2)
          .attr("y", d => y((d.yValue + ((userLineData.m * d.xValue) + userLineData.b))/2))
          ;
      
    //Check the residuals toggle
    if (!userLineResidualsToggle.checked) {
      userLineResidualsGroup
        .classed('hidden', true);
    } else if (userLineResidualsToggle.checked) {
        userLineResidualsGroup
          .classed('hidden', false);
      }
    
    // make everything easier to see!
    focusGraphics();
    
  }

  function focusGraphics() {
    if (residualsToggle.checked && userLineResidualsToggle.checked) {
      residualsGroup
          .classed('offsetLeft', true);
      userLineResidualsGroup
          .classed('offsetRight', true);
      
    } else {
      residualsGroup
          .classed('offsetLeft', false);
      userLineResidualsGroup
          .classed('offsetRight', false);
      
    }
    if (residualsToggle.checked || userLineResidualsToggle.checked) {
      userLine
      .classed('outFocus',true);
      bestFitLine
      .classed('outFocus',true);;
    } else {
      userLine
            .classed('outFocus',false);
      bestFitLine
            .classed('outFocus',false);;
    }
  }

  function getLength (x,y,xx,yy) {
    const diffX = x - xx;
    const diffY = y - yy;
    const length = Math.hypot(diffX,diffY);
    return length;
  }


});
