// calculator.js
// Simple JavaScript Calculator
// Repeatedly prompts the user for two numbers and an operator,
// computes the result, logs each attempt in a table, then
// shows a summary table of the valid results.

var validResults = []; // keep track of only the successfully computed results
var keepGoing = true;

// Start the results table
document.write("<table>");
document.write("<tr><th>Number 1</th><th>Operator</th><th>Number 2</th><th>Result</th></tr>");

while (keepGoing) {
  var xInput = prompt("Enter the first number (x):");
  if (xInput === null) {
    keepGoing = false;
    break;
  }

  var yInput = prompt("Enter the second number (y):");
  if (yInput === null) {
    keepGoing = false;
    break;
  }

  var operator = prompt("Enter an operator (+, -, *, /, %):");
  if (operator === null) {
    keepGoing = false;
    break;
  }

  var x = parseFloat(xInput);
  var y = parseFloat(yInput);
  var result;

  // Validate numeric input
  if (isNaN(x) || isNaN(y)) {
    result = "<span class='error'>Error: x and y must be numbers</span>";
  } else if (operator !== "+" && operator !== "-" && operator !== "*" && operator !== "/" && operator !== "%") {
    // Validate the operator
    result = "<span class='error'>Error: invalid operator</span>";
  } else {
    // Perform the calculation
    switch (operator) {
      case "+":
        result = x + y;
        break;
      case "-":
        result = x - y;
        break;
      case "*":
        result = x * y;
        break;
      case "/":
        result = (y === 0) ? "<span class='error'>Error: divide by zero</span>" : x / y;
        break;
      case "%":
        result = (y === 0) ? "<span class='error'>Error: divide by zero</span>" : x % y;
        break;
    }

    // Only save numeric (valid) results for the summary table
    if (typeof result === "number") {
      validResults.push(result);
    }
  }

  document.write("<tr><td>" + xInput + "</td><td>" + operator + "</td><td>" + yInput + "</td><td>" + result + "</td></tr>");
}

document.write("</table>");

// Build the summary table from the valid results
document.write("<h2>Summary</h2>");

if (validResults.length > 0) {
  var min = Math.min.apply(null, validResults);
  var max = Math.max.apply(null, validResults);
  var total = validResults.reduce(function (sum, val) {
    return sum + val;
  }, 0);
  var avg = total / validResults.length;

  document.write("<table>");
  document.write("<tr><th>Minimum</th><th>Maximum</th><th>Average</th><th>Total</th></tr>");
  document.write("<tr><td>" + min + "</td><td>" + max + "</td><td>" + avg.toFixed(2) + "</td><td>" + total + "</td></tr>");
  document.write("</table>");
} else {
  document.write("<p>No valid calculations were entered.</p>");
}
