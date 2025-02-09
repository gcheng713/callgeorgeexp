const API_URL = "https://home-inspector-vpyg.vercel.app/api/bookings"
const VAPI_LOGS_URL = "https://api.vapi.ai/logs"

export const createInspection = async (inspectionData) => {
  try {
    if (!inspectionData) {
      console.warn('No inspection data provided');
      return null;
    }

    // Fetch logs from Vapi API
    const logsResponse = await fetch(VAPI_LOGS_URL, {
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_VAPI_PUBLIC_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const logsData = await logsResponse.json();

    // Log the data for development
    console.log('Inspection Data:', inspectionData);
    console.log('Call Logs:', logsData);
    
    const callData = {
      timestamp: new Date().toISOString(),
      bookingDetails: inspectionData,
      callAnalysis: logsData?.results[0] || null
    };

    // Make API call to save the data
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(callData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
    
  } catch (error) {
    console.error('Error creating inspection:', error);
    return null;
  }
};