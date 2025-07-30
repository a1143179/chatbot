import React, { useState } from 'react';
import config from '../config';

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

const CorsTest: React.FC = () => {
  const [optionsResult, setOptionsResult] = useState<TestResult | null>(null);
  const [postResult, setPostResult] = useState<TestResult | null>(null);
  const [simpleResult, setSimpleResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const testOptions = async () => {
    setLoading('options');
    try {
      console.log('Testing OPTIONS request...');
      console.log('Request URL:', config.apiUrl);
      console.log('Request origin:', window.location.origin);
      
      const response = await fetch(config.apiUrl, {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });

      const result: TestResult = {
        success: response.status === 200,
        message: `OPTIONS Request - Status: ${response.status}`,
        details: {
          status: response.status,
          origin: window.location.origin,
          corsHeaders: {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
            'Access-Control-Max-Age': response.headers.get('Access-Control-Max-Age')
          },
          allHeaders: Object.fromEntries(response.headers.entries())
        }
      };

      setOptionsResult(result);
      console.log('OPTIONS result:', result.success ? 'SUCCESS' : 'FAILED');
    } catch (error) {
      const result: TestResult = {
        success: false,
        message: `OPTIONS Request Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          type: error instanceof Error ? error.constructor.name : typeof error,
          url: config.apiUrl,
          origin: window.location.origin,
          note: 'This usually indicates a CORS preflight failure or network issue'
        }
      };
      setOptionsResult(result);
      console.error('❌ OPTIONS request error:', error);
    } finally {
      setLoading(null);
    }
  };

  const testPost = async () => {
    setLoading('post');
    try {
      console.log('Testing POST request...');
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        body: JSON.stringify({
          prompt: 'Hello from React CORS test'
        })
      });

      const result: TestResult = {
        success: response.ok,
        message: `POST Request - Status: ${response.status}`,
        details: {
          status: response.status,
          origin: window.location.origin,
          corsHeaders: {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Content-Type': response.headers.get('Content-Type')
          }
        }
      };

      if (response.ok) {
        const data = await response.json();
        result.details!.response = data;
        console.log('✅ POST request successful');
      } else {
        const errorText = await response.text();
        result.details!.error = errorText;
        console.log('❌ POST request failed');
      }

      setPostResult(result);
    } catch (error) {
      const result: TestResult = {
        success: false,
        message: `POST Request Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      };
      setPostResult(result);
      console.error('❌ POST request error:', error);
    } finally {
      setLoading(null);
    }
  };

  const testSimpleFetch = async () => {
    setLoading('simple');
    try {
      console.log('Testing simple fetch...');
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: 'Simple test from React'
        })
      });

      const result: TestResult = {
        success: response.ok,
        message: `Simple Fetch - Status: ${response.status}`,
        details: {
          status: response.status,
          allHeaders: Object.fromEntries(response.headers.entries())
        }
      };

      if (response.ok) {
        const data = await response.json();
        result.details!.response = data;
      } else {
        const errorText = await response.text();
        result.details!.error = errorText;
      }

      setSimpleResult(result);
    } catch (error) {
      const result: TestResult = {
        success: false,
        message: `Simple Fetch Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      };
      setSimpleResult(result);
      console.error('❌ Simple fetch error:', error);
    } finally {
      setLoading(null);
    }
  };

  const testHealthCheck = async () => {
    setLoading('health');
    try {
      console.log('Testing health check...');
      console.log('API URL:', config.apiUrl);
      console.log('Current origin:', window.location.origin);
      
      const response = await fetch(config.apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result: TestResult = {
        success: response.status === 405, // Expected: Method Not Allowed
        message: `Health Check - Status: ${response.status}`,
        details: {
          status: response.status,
          statusText: response.statusText,
          allHeaders: Object.fromEntries(response.headers.entries()),
          note: '405 Method Not Allowed is expected for GET requests'
        }
      };

      if (response.status === 405) {
        result.details!.note = '✅ API is accessible - 405 is expected for GET requests';
      } else {
        const errorText = await response.text();
        result.details!.error = errorText;
      }

      setSimpleResult(result);
    } catch (error) {
      const result: TestResult = {
        success: false,
        message: `Health Check Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          type: error instanceof Error ? error.constructor.name : typeof error,
          url: config.apiUrl,
          origin: window.location.origin,
          note: 'This indicates the API is not accessible or blocked by CORS',
          possibleCauses: [
            'CORS policy blocking the request',
            'Network connectivity issues',
            'API server down',
            'Browser security restrictions'
          ]
        }
      };
      setSimpleResult(result);
      console.error('❌ Health check error:', error);
    } finally {
      setLoading(null);
    }
  };

  const testNetworkConnection = async () => {
    setLoading('network');
    try {
      console.log('Testing network connection...');
      
      // Test basic connectivity
      const response = await fetch('https://httpbin.org/get', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result: TestResult = {
        success: response.ok,
        message: `Network Test - Status: ${response.status}`,
        details: {
          status: response.status,
          statusText: response.statusText,
          note: response.ok ? '✅ Basic network connectivity is working' : '❌ Network connectivity issues',
          testUrl: 'https://httpbin.org/get',
          apiUrl: config.apiUrl
        }
      };

      if (response.ok) {
        const data = await response.json();
        result.details!.response = { origin: data.origin };
      }

      setSimpleResult(result);
    } catch (error) {
      const result: TestResult = {
        success: false,
        message: `Network Test Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          note: '❌ Basic network connectivity is not working',
          testUrl: 'https://httpbin.org/get',
          apiUrl: config.apiUrl
        }
      };
      setSimpleResult(result);
      console.error('❌ Network test error:', error);
    } finally {
      setLoading(null);
    }
  };

  const showCurlCommands = () => {
    const curlCommands = {
      options: `curl -X OPTIONS "https://chatbotprocessor.azurewebsites.net/api/process" \\
  -H "Origin: http://localhost:3000" \\
  -H "Access-Control-Request-Method: POST" \\
  -H "Access-Control-Request-Headers: Content-Type" \\
  -v`,
      
      post: `curl -X POST "https://chatbotprocessor.azurewebsites.net/api/process" \\
  -H "Content-Type: application/json" \\
  -H "Origin: http://localhost:3000" \\
  -d '{"prompt": "Hello from curl test"}' \\
  -v`,
      
      simple: `curl -X POST "https://chatbotprocessor.azurewebsites.net/api/process" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "Simple test"}' \\
  -v`,
      
      health: `curl -X GET "https://chatbotprocessor.azurewebsites.net/api/process" \\
  -H "Content-Type: application/json" \\
  -v`
    };

    const result: TestResult = {
      success: true,
      message: 'Curl Commands for Testing',
      details: {
        note: 'Use these curl commands to test CORS from terminal:',
        commands: curlCommands
      }
    };

    setSimpleResult(result);
  };

  const renderResult = (result: TestResult | null, testName: string) => {
    if (!result) return null;

    return (
      <div className={`result ${result.success ? 'success' : 'error'}`}>
        <h4>{result.message}</h4>
        {result.details && (
          <pre>{JSON.stringify(result.details, null, 2)}</pre>
        )}
      </div>
    );
  };

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      minHeight: '100vh',
      overflowY: 'auto'
    }}>
      <h1>🔍 CORS Test for Azure Functions</h1>
      <p>Testing CORS functionality for your chatbot API.</p>
      
      <div style={{ margin: '20px 0', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>📋 Test 1: OPTIONS Preflight Request</h2>
        <p>Tests if the server properly handles CORS preflight requests.</p>
        <button 
          onClick={testOptions} 
          disabled={loading === 'options'}
          style={{
            padding: '10px 20px',
            margin: '5px',
            border: 'none',
            borderRadius: '3px',
            backgroundColor: loading === 'options' ? '#6c757d' : '#007bff',
            color: 'white',
            cursor: loading === 'options' ? 'not-allowed' : 'pointer'
          }}
        >
          {loading === 'options' ? 'Testing...' : 'Test OPTIONS'}
        </button>
        {renderResult(optionsResult, 'OPTIONS')}
      </div>
      
      <div style={{ margin: '20px 0', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>📤 Test 2: POST Request</h2>
        <p>Tests if the server accepts POST requests with CORS headers.</p>
        <button 
          onClick={testPost} 
          disabled={loading === 'post'}
          style={{
            padding: '10px 20px',
            margin: '5px',
            border: 'none',
            borderRadius: '3px',
            backgroundColor: loading === 'post' ? '#6c757d' : '#007bff',
            color: 'white',
            cursor: loading === 'post' ? 'not-allowed' : 'pointer'
          }}
        >
          {loading === 'post' ? 'Testing...' : 'Test POST'}
        </button>
        {renderResult(postResult, 'POST')}
      </div>
      
      <div style={{ margin: '20px 0', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>🌐 Test 3: Simple Fetch</h2>
        <p>Tests a basic fetch request without CORS headers.</p>
        <button 
          onClick={testSimpleFetch} 
          disabled={loading === 'simple'}
          style={{
            padding: '10px 20px',
            margin: '5px',
            border: 'none',
            borderRadius: '3px',
            backgroundColor: loading === 'simple' ? '#6c757d' : '#007bff',
            color: 'white',
            cursor: loading === 'simple' ? 'not-allowed' : 'pointer'
          }}
        >
          {loading === 'simple' ? 'Testing...' : 'Test Simple Fetch'}
        </button>
        {renderResult(simpleResult, 'Simple')}
      </div>

      <div style={{ margin: '20px 0', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>🏥 Test 4: Health Check</h2>
        <p>Tests if the API is accessible (expects 405 Method Not Allowed).</p>
        <button 
          onClick={testHealthCheck} 
          disabled={loading === 'health'}
          style={{
            padding: '10px 20px',
            margin: '5px',
            border: 'none',
            borderRadius: '3px',
            backgroundColor: loading === 'health' ? '#6c757d' : '#28a745',
            color: 'white',
            cursor: loading === 'health' ? 'not-allowed' : 'pointer'
          }}
        >
          {loading === 'health' ? 'Testing...' : 'Test Health Check'}
        </button>
        {renderResult(simpleResult, 'Health')}
      </div>

      <div style={{ margin: '20px 0', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>🌐 Test 5: Network Connection</h2>
        <p>Tests if you can connect to a public API (e.g., httpbin.org) to check network connectivity.</p>
        <button 
          onClick={testNetworkConnection} 
          disabled={loading === 'network'}
          style={{
            padding: '10px 20px',
            margin: '5px',
            border: 'none',
            borderRadius: '3px',
            backgroundColor: loading === 'network' ? '#6c757d' : '#007bff',
            color: 'white',
            cursor: loading === 'network' ? 'not-allowed' : 'pointer'
          }}
        >
          {loading === 'network' ? 'Testing...' : 'Test Network Connection'}
        </button>
        {renderResult(simpleResult, 'Network')}
      </div>

      <div style={{ margin: '20px 0', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>🔧 Test 6: Curl Commands</h2>
        <p>Shows curl commands to test CORS from terminal (bypasses browser CORS restrictions).</p>
        <button 
          onClick={showCurlCommands} 
          style={{
            padding: '10px 20px',
            margin: '5px',
            border: 'none',
            borderRadius: '3px',
            backgroundColor: '#17a2b8',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Show Curl Commands
        </button>
        {renderResult(simpleResult, 'Curl')}
      </div>

      <style>{`
        .result {
          margin: 10px 0;
          padding: 10px;
          border-radius: 3px;
          font-family: monospace;
          white-space: pre-wrap;
          max-height: 400px;
          overflow-y: auto;
          overflow-x: auto;
        }
        .success {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        .error {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        pre {
          background-color: #f8f9fa;
          padding: 10px;
          border-radius: 3px;
          overflow-x: auto;
          font-size: 12px;
          max-height: 300px;
          overflow-y: auto;
        }
        body {
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
};

export default CorsTest; 