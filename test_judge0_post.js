async function run() {
  const code = `#include<iostream>\nusing namespace std;\nint main() { cout << "Hello"; return 0; }`;
  const encodedSource = btoa(code);
  const judge0LangId = 54; // C++

  // Submit 5 batches of 20 to get 100 tokens
  const allTokens = [];
  const chunkPromises = [];

  for (let c = 0; c < 5; c++) {
    const submissions = [];
    for (let i = 0; i < 20; i++) {
      submissions.push({
        source_code: encodedSource,
        language_id: judge0LangId,
        stdin: btoa(`input ${c * 20 + i}`),
        expected_output: btoa("Hello")
      });
    }

    const payload = { submissions };
    
    chunkPromises.push(
      globalThis.fetch("https://judge0myownserver.store/submissions/batch?base64_encoded=true", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to post batch: ${res.status} - ${await res.text()}`);
        }
        const data = await res.json();
        return data.map((item) => item.token);
      })
    );
  }

  try {
    const tokenChunks = await Promise.all(chunkPromises);
    allTokens.push(...tokenChunks.flat());
    console.log(`Successfully submitted 100 cases! Total tokens collected: ${allTokens.length}`);

    // Try to query all 100 tokens using the GET-based status endpoint
    const tokensString = allTokens.join(",");
    const getResponse = await globalThis.fetch(`https://judge0myownserver.store/submissions/batch?tokens=${tokensString}&base64_encoded=true&fields=status_id,compile_output,stdout,time,memory`, {
      method: "GET"
    });
    
    console.log("GET Status:", getResponse.status);
    console.log("GET Status Text:", getResponse.statusText);
    
    const getBody = await getResponse.json();
    console.log("GET Response item count:", getBody.submissions ? getBody.submissions.length : (Array.isArray(getBody) ? getBody.length : "unknown"));
    console.log("First item sample:", JSON.stringify(getBody.submissions ? getBody.submissions[0] : (Array.isArray(getBody) ? getBody[0] : getBody), null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
