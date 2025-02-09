const API_URL = ""

export const createInspection = async (inspectionData) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inspectionData)
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to create inspection:', error);
    throw error;
  }
};