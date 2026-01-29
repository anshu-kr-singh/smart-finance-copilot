// File upload processing edge function

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ProcessedData {
  transactions: number;
  totalAmount: string;
  period: string;
  type: string;
  summary: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    
    let fileName = "unknown";
    let fileType = "unknown";
    let fileContent = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      
      if (!file) {
        return new Response(
          JSON.stringify({ error: "No file provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      fileName = file.name;
      fileType = file.type;
      
      // For text-based files, read the content
      if (fileType.includes("text") || 
          fileName.endsWith(".csv") || 
          fileName.endsWith(".json")) {
        fileContent = await file.text();
      } else {
        // For binary files (Excel, PDF), we simulate processing
        fileContent = `[Binary file: ${fileName}, Size: ${file.size} bytes]`;
      }
    }

    // Analyze file and generate mock processing results
    // In production, this would use OCR, Excel parsing, etc.
    const processedData = await analyzeFile(fileName, fileType, fileContent);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: processedData,
        fileName,
        fileType,
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Processing error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to process file" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

async function analyzeFile(
  fileName: string, 
  fileType: string, 
  content: string
): Promise<ProcessedData> {
  // Determine file category based on name patterns
  const lowerName = fileName.toLowerCase();
  
  let documentType = "General";
  let transactionCount = Math.floor(Math.random() * 200) + 50;
  let amount = Math.floor(Math.random() * 5000000) + 100000;
  
  if (lowerName.includes("bank") || lowerName.includes("statement")) {
    documentType = "Bank Statement";
    transactionCount = Math.floor(Math.random() * 300) + 100;
  } else if (lowerName.includes("invoice") || lowerName.includes("bill")) {
    documentType = "Invoice";
    transactionCount = Math.floor(Math.random() * 50) + 10;
  } else if (lowerName.includes("gst") || lowerName.includes("gstr")) {
    documentType = "GST Return";
    transactionCount = Math.floor(Math.random() * 100) + 20;
  } else if (lowerName.includes("ledger")) {
    documentType = "Ledger";
    transactionCount = Math.floor(Math.random() * 500) + 200;
  } else if (lowerName.includes("sales")) {
    documentType = "Sales Register";
    transactionCount = Math.floor(Math.random() * 400) + 100;
  } else if (lowerName.includes("purchase")) {
    documentType = "Purchase Register";
    transactionCount = Math.floor(Math.random() * 300) + 80;
  }

  // If CSV content is available, try to count lines
  if (content && !content.startsWith("[Binary")) {
    const lines = content.split("\n").filter(line => line.trim());
    if (lines.length > 1) {
      transactionCount = lines.length - 1; // Exclude header
    }
  }

  // Format amount in Indian notation
  const formattedAmount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

  // Generate current period
  const now = new Date();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const period = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

  return {
    transactions: transactionCount,
    totalAmount: formattedAmount,
    period,
    type: documentType,
    summary: `Processed ${transactionCount} entries from ${documentType}. Total value: ${formattedAmount}. Ready for agent analysis.`,
  };
}
