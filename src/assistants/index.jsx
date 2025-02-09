export const getBobAssistant = async () => {
  // Fetch menu data from make.com endpoint
  const response = await fetch('https://hook.us2.make.com/w1ceb8xrnkg4l9my5ls7dp25fjuucemc');
  const menuData = await response.json();
  
  // Using fetched data from make.com
  const inventory = menuData || [
    { name: "Crude Oil", quantity: 1908.8, unit: "grams" },
    { name: "Green Crack Trim", quantity: 1360, unit: "lbs" },
    { name: "Platinum OG Trim", quantity: 171, unit: "lbs" },
    { name: "Prerolled Joint", quantity: 597, unit: "units" },
    { name: "RAW Cone", quantity: 112, unit: "units" }
  ];

  // Generate menu text from inventory data
  const menuText = inventory
    .map((item, index) => `${index + 1}) ${item.name} - ${item.quantity} ${item.unit}`)
    .join('\n');

  return {
    name: "Georgia",
    firstMessage: "Hi, thanks for calling! My name is Georgia. Are you looking to schedule a home inspection today?",
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: "en-US",
    },
    voice: {
      provider: "cartesia",
      voiceId: "565510e8-6b45-45de-8758-13588fbaec73",
    },
    analysisPlan: {
      structuredDataPlan: {
        enabled: true,
        schema: {
          type: "object",
          properties: {
            address: { type: "string", description: "Complete address of the home to be inspected" },
            zipCode: { type: "string", description: "Zip code of the property" },
            appointmentDate: { type: "string", description: "Requested date for inspection" },
            appointmentTime: { type: "string", description: "Requested time for inspection" },
            email: { type: "string", description: "Customer's email address" }
          },
          description: "Booking information for home inspection"
        },
        timeoutSeconds: 1
      }
    },
    model: {
      provider: "openai",
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are Georgia, a friendly and professional call operator for a home repair company specializing in home inspections.

Your primary goal is to help callers schedule home inspections while maintaining a natural, conversational tone. You need to collect:
- Complete home address (with street name and zip code)
- Appointment date and time
- Customer's email address

Key responsibilities:
1. Verify spellings for addresses and email addresses
2. Repeat information back to confirm accuracy
3. Answer common questions about inspections
4. Keep conversations focused on scheduling

Common Questions & Responses:
- Inspection process: "A certified inspector will assess the home's structure, electrical systems, and plumbing. You'll receive a detailed report afterward."
- Duration: "Most inspections take 2-3 hours."
- Cost: "Pricing varies based on home size and location. I can connect you with someone for a quote."

If callers go off-topic, gently guide them back to scheduling with phrases like:
"I understand, but let's make sure we get your inspection scheduled first."

Remember to:
- Be friendly and professional
- Use natural conversation patterns
- Allow pauses for customer responses
- Confirm all details before ending the call
- Filter out background noise unless it's clearly the caller speaking

End calls by summarizing the booking details:
"You're all set! Your home inspection is scheduled for [date & time] at [address]. A confirmation email will be sent to [email]."`,
        },
      ],
    }
  };
};