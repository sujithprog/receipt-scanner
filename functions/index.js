const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({origin: true});

admin.initializeApp();

exports.processReceipt = functions.https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "User must be authenticated."
        );
    }

    try {
        const {imageUrl, receiptId} = data;
        
        // Call Mistral AI API for OCR processing
        const mistralResponse = await axios.post(
            "https://api.mistral.ai/v1/vision",
            {
                model: "mistral-large-vision",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "Extract all information from this receipt, including: store name, " +
                                      "date, items purchased, prices, subtotal, tax, and total amount. " +
                                      "Format the response as a structured JSON object.",
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: imageUrl,
                                },
                            },
                        ],
                    },
                ],
                max_tokens: 1000,
            },
            {
                headers: {
                    "Authorization": `Bearer ${functions.config().mistral.key}`,
                    "Content-Type": "application/json",
                },
            }
        );
        
        // Parse the response
        const responseText = mistralResponse.data.choices[0].message.content;
        let jsonData = {};
        
        // Try to extract JSON from the response
        try {
            const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                           responseText.match(/{[\s\S]*}/);
                          
            if (jsonMatch) {
                jsonData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            } else {
                jsonData = {rawText: responseText};
            }
        } catch (err) {
            console.error("Error parsing JSON:", err);
            jsonData = {rawText: responseText};
        }
        
        // Update the receipt in Firestore
        await admin.firestore().collection("receipts").doc(receiptId).update({
            merchantName: jsonData.merchantName || jsonData.storeName || "",
            date: jsonData.date || "",
            total: jsonData.total || jsonData.totalAmount || "",
            items: jsonData.items || [],
            subtotal: jsonData.subtotal || "",
            tax: jsonData.tax || "",
            rawData: jsonData,
            status: "processed",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        return {success: true, data: jsonData};
        
    } catch (error) {
        console.error("OCR Processing Error:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});