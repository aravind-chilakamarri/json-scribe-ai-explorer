
import { Context } from "@netlify/edge-functions";

// This is a Netlify Edge Function that provides FastAPI-like functionality
export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '');

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  try {
    // Route handling similar to FastAPI
    switch (path) {
      case 'health':
        return new Response(
          JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }),
          { 
            status: 200, 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders 
            } 
          }
        );

      case 'validate-json':
        if (request.method === 'POST') {
          const body = await request.json();
          try {
            JSON.parse(body.content);
            return new Response(
              JSON.stringify({ valid: true, message: 'Valid JSON' }),
              { 
                status: 200, 
                headers: { 
                  'Content-Type': 'application/json',
                  ...corsHeaders 
                } 
              }
            );
          } catch (error) {
            return new Response(
              JSON.stringify({ 
                valid: false, 
                message: error instanceof Error ? error.message : 'Invalid JSON' 
              }),
              { 
                status: 400, 
                headers: { 
                  'Content-Type': 'application/json',
                  ...corsHeaders 
                } 
              }
            );
          }
        }
        break;

      case 'transform-json':
        if (request.method === 'POST') {
          const body = await request.json();
          const { content, operation } = body;
          
          try {
            const parsed = JSON.parse(content);
            let result;
            
            switch (operation) {
              case 'beautify':
                result = JSON.stringify(parsed, null, 2);
                break;
              case 'minify':
                result = JSON.stringify(parsed);
                break;
              default:
                result = content;
            }
            
            return new Response(
              JSON.stringify({ success: true, result }),
              { 
                status: 200, 
                headers: { 
                  'Content-Type': 'application/json',
                  ...corsHeaders 
                } 
              }
            );
          } catch (error) {
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: error instanceof Error ? error.message : 'Processing failed' 
              }),
              { 
                status: 400, 
                headers: { 
                  'Content-Type': 'application/json',
                  ...corsHeaders 
                } 
              }
            );
          }
        }
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Endpoint not found' }),
          { 
            status: 404, 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders 
            } 
          }
        );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { 
      status: 405, 
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      } 
    }
  );
};
