import { PrismaClient } from '@prisma/client';
import { createInspection } from '../api/inspections';

const prisma = new PrismaClient();

export const getBobAssistant = async () => {
  return {
    name: "Georgia",
    firstMessage: "Hi, thanks for calling! My name is George. Are you looking to schedule a home inspection today?",
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
            propertyType: { type: "string", description: "Type of property (e.g., residential, commercial)" },
            squareFootage: { type: "number", description: "Square footage of the property" },
            appointmentDate: { type: "string", description: "Requested date for inspection" },
            customerName: { type: "string", description: "Customer's full name" },
            customerEmail: { type: "string", description: "Customer's email address" }
          },
          description: "Booking information for home inspection",
 

        },
        timeoutSeconds: 1
      }
    },
    server: {
      url: "https://home-inspector-vpyg.vercel.app/api/webhook",
    },
    onComplete: async (conversation) => {
      try {
        const data = conversation.structuredData;
        console.log('Raw conversation data:', conversation);
        console.log('Structured data:', data);
        
        // Format data using Groq
        console.log('Sending to Groq API:', {
          endpoint: process.env.GROQ_API_ENDPOINT,
          data: data
        });

        const groqResponse = await fetch(process.env.GROQ_API_ENDPOINT + '/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'mixtral-8x7b-32768',
            messages: [{
              role: 'system',
              content: 'Convert the following inspection data into a booking format with startTime, name, email, notes, and address fields.'
            }, {
              role: 'user',
              content: JSON.stringify(data)
            }]
          })
        });

        const groqData = await groqResponse.json();
        console.log('Groq API response:', groqData);

        const formattedData = JSON.parse(groqData.choices[0].message.content);
        console.log('Formatted data:', formattedData);

        const bookingPayload = {
          startTime: formattedData.startTime || data.appointmentDate,
          name: formattedData.name || data.customerName,
          email: formattedData.email || data.customerEmail,
          notes: `Property Type: ${data.propertyType}, Square Footage: ${data.squareFootage}`,
          address: formattedData.address || data.address
        };
        console.log('Booking API payload:', bookingPayload);

        // Make booking API call
        const bookingResponse = await fetch('https://home-inspector-vpyg.vercel.app/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(bookingPayload)
        });

        const bookingResult = await bookingResponse.json();
        console.log('Booking API response:', bookingResult);

        return bookingResult;
      } catch (error) {
        console.error('Failed to create inspection:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
        return null;
      }
    },
    model: {
      provider: "openai",
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are Georgia, a friendly and professional call operator for a home repair company specializing in home inspections.

Your primary goal is to help callers schedule home inspections while maintaining a natural, conversational tone. You must collect ALL of the following information:
- Complete home address (with street name and zip code)
- Property type (residential or commercial)
- Approximate square footage of the property
- Preferred appointment date and time
- Customer's full name
- Customer's email address (ask for spelling)

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

Before ending the call, verify you have collected ALL required information:
1. Property Address: [repeat full address]
2. Property Type: [residential/commercial]
3. Square Footage: [number]
4. Appointment Date & Time: [date and time]
5. Customer Name: [full name]
6. Email Address: [spell out email]

End calls by summarizing ALL booking details:
"Perfect! Let me confirm everything: We'll be inspecting your [square footage] square foot [property type] property at [address]. The inspection is scheduled for [date & time]. I'll send the confirmation email to [spell out email]. Is all of that information correct?"

After confirmation, close with:
"Great! You're all set for your inspection. You'll receive a confirmation email shortly with all these details. Thank you for choosing our services!"`,
        },
      ],
    }
  };
};