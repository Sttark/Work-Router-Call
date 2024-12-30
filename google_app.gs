function fetchOrderDetailsAndCalculate(orderId) {
  //orderId = "733236";
  if (!orderId) {
    Logger.log("Error: orderId is not provided.");
    return { error: "Order ID is required." };
  }

  const machineId = "227"; // Replace with your machine ID
  const apiUrl = `https://www.sttark.com/api/orders/specs/${orderId}/${machineId}`;
  const options = {
    method: 'get',
    headers: {
      Accept: 'application/json'
    }
  };

  try {
    // Fetch data from API
    const response = UrlFetchApp.fetch(apiUrl, options);
    const responseText = response.getContentText();
    Logger.log("API Response: " + responseText); // Log the API response for debugging

    const data = JSON.parse(responseText);

    // Extract required fields
    const substrate = data?.substrates?.name || "Unknown Substrate";
    let laminate = data?.laminates?.label || "Unknown Laminate";

    if (laminate === "No Laminate") {
      laminate = "Unlaminated";
      Logger.log(`Laminate adjusted to: ${laminate} (No Laminate mapped to Unlaminated)`);
    }

    const folded_height = data?.dies?.folded_height || 0;
    const folded_width = data?.dies?.folded_width || 0;
    const stack_height = data?.dies?.stack_height || 0.065;
    const msi_per_carton = data?.dies?.msi_per_carton || 0;
    const total_qty = data?.order?.total_qty || 1;
    const design_qty = data?.order?.design_qty || "N/A"; // Add Design Quantity
    const carton_type = data?.dies?.shape_label || "N/A";

    const sizeCalculator = data?.dies?.sizeCalculator || null;
    let size_length = "N/A";
    let size_width = "N/A";
    let size_depth = "N/A";

    if (sizeCalculator) {
      size_length = sizeCalculator.length || "N/A";
      size_width = sizeCalculator.width || "N/A";
      size_depth = sizeCalculator.depth || "N/A";
    } else {
      Logger.log("Size Calculator is undefined or null in the API response.");
    }

    const substrate_weight_msi = lookupSubstrateWeight(substrate);
    const laminate_weight_msi = lookupLaminateWeight(laminate);

    Logger.log(`Lookup Results: 
      Substrate: ${substrate}, Weight (MSI): ${substrate_weight_msi}, 
      Laminate: ${laminate}, Weight (MSI): ${laminate_weight_msi}`);

    const order_msi = msi_per_carton * total_qty;
    Logger.log(`Order MSI: ${order_msi} (MSI Per Carton x Total Quantity)`);

    const total_order_weight = (substrate_weight_msi * order_msi) + (laminate_weight_msi * order_msi);
    Logger.log(`Total Order Weight: ${total_order_weight.toFixed(2)}`);

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const activeShippingBoxesRange = spreadsheet.getRangeByName("ActiveShippingBoxes");
    const boxSizes = activeShippingBoxesRange.getValues().flat().filter(Boolean);
    Logger.log("Box Sizes from ActiveShippingBoxes: " + JSON.stringify(boxSizes));

    const boxResults = [];
    for (let i = 0; i < boxSizes.length; i++) {
      const [boxLength, boxWidth, boxDepth] = boxSizes[i].split("x").map(Number);

      const numberRows = Math.floor(boxLength / folded_height) || 0;
      const cartonsPerRow = Math.floor(boxWidth / stack_height) || 0;
      const cartonsPerLayer = numberRows * cartonsPerRow || 0;
      const numberLayers = Math.min(Math.floor(boxDepth / folded_width), 3) || 0;
      const totalCartons = cartonsPerLayer * numberLayers || 0;
      const numberBoxes = totalCartons > 0 ? Math.ceil(total_qty / totalCartons) : 0;
      const weightPerBox = numberBoxes > 0 ? total_order_weight / numberBoxes : 0;

      boxResults.push({
        size: boxSizes[i],
        weight: isFinite(weightPerBox) ? weightPerBox.toFixed(2) : "N/A",
        numBoxes: numberBoxes || "N/A",
        qtyPerBox: totalCartons || "N/A"
      });
    }

    Logger.log("Final Box Results: " + JSON.stringify(boxResults));

    return {
      order_id: orderId,
      design_qty, // Include Design Quantity
      substrate,
      laminate,
      carton_type,
      size_length,
      size_width,
      size_depth,
      folded_height,
      folded_width,
      stack_height,
      msi_per_carton,
      total_qty,
      total_order_weight,
      boxResults
    };

  } catch (error) {
    Logger.log("Error: " + error.message);
    return { error: error.message };
  }
}

function lookupSubstrateWeight(substrate) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const range = spreadsheet.getRangeByName("SubstrateLUT");

  if (!range) {
    Logger.log("Error: Named range 'SubstrateLUT' not found.");
    return 0;
  }

  const data = range.getValues();
  for (const row of data) {
    const substrateName = row[0]?.replace(/18 pt$/, "").trim();
    if (substrate.includes(substrateName)) {
      Logger.log(`Substrate Found: ${row[0]}, Weight Per MSI: ${row[13]}`);
      return row[13];
    }
  }
  return 0;
}

function lookupLaminateWeight(laminate) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const range = spreadsheet.getRangeByName("LaminateLUT");

  if (!range) {
    Logger.log("Error: Named range 'LaminateLUT' not found.");
    return 0;
  }

  const data = range.getValues();
  for (const row of data) {
    const laminateName = row[0]?.trim();
    if (laminate.includes(laminateName)) {
      Logger.log(`Laminate Found: ${row[0]}, Weight Per MSI: ${row[5]}`);
      return row[5];
    }
  }
  return 0;
}
