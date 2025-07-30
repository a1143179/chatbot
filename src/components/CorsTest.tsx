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
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
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

      <style>{`
        .result {
          margin: 10px 0;
          padding: 10px;
          border-radius: 3px;
          font-family: monospace;
          white-space: pre-wrap;
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
        }
      `}</style>
    </div>
  );
};

export default CorsTest; 