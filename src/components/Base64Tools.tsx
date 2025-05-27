
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

export function Base64Tools() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('decode');
  const [isImage, setIsImage] = useState(false);

  const handleEncode = () => {
    try {
      const encoded = btoa(input);
      setOutput(encoded);
      setIsImage(false);
    } catch (error) {
      setOutput('Error: Could not encode input');
      setIsImage(false);
    }
  };

  const handleDecode = () => {
    try {
      const decoded = atob(input);
      setOutput(decoded);
      
      // Check if it's an image by looking for image data URL pattern
      const imagePattern = /^data:image\/(png|jpg|jpeg|gif|webp|svg\+xml);base64,/;
      if (input.match(imagePattern) || input.startsWith('/9j/') || input.startsWith('iVBORw0KGgo') || input.startsWith('R0lGODlh')) {
        setIsImage(true);
      } else {
        setIsImage(false);
      }
    } catch (error) {
      setOutput('Error: Invalid Base64 input');
      setIsImage(false);
    }
  };

  const getImageSrc = () => {
    if (input.startsWith('data:image/')) {
      return input;
    }
    // Assume PNG if no data URL prefix
    return `data:image/png;base64,${input}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          onClick={() => setMode('encode')}
          variant={mode === 'encode' ? 'default' : 'outline'}
          size="sm"
        >
          Encode
        </Button>
        <Button
          onClick={() => setMode('decode')}
          variant={mode === 'decode' ? 'default' : 'outline'}
          size="sm"
        >
          Decode
        </Button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Input {mode === 'encode' ? '(Plain Text)' : '(Base64)'}
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full h-32 p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={mode === 'encode' ? 'Enter text to encode...' : 'Enter Base64 string to decode...'}
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={mode === 'encode' ? handleEncode : handleDecode}>
          {mode === 'encode' ? 'Encode to Base64' : 'Decode from Base64'}
        </Button>
        <Button
          onClick={() => {
            setInput('');
            setOutput('');
            setIsImage(false);
          }}
          variant="outline"
        >
          Clear
        </Button>
      </div>

      {output && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Output {mode === 'encode' ? '(Base64)' : '(Plain Text)'}
          </label>
          {isImage && mode === 'decode' ? (
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Detected image content:</div>
              <img
                src={getImageSrc()}
                alt="Decoded"
                className="max-w-full h-auto border border-gray-200 rounded-lg"
                onError={() => setIsImage(false)}
              />
            </div>
          ) : (
            <textarea
              value={output}
              readOnly
              className="w-full h-32 p-3 border border-gray-200 rounded-lg resize-none bg-gray-50"
            />
          )}
        </div>
      )}
    </div>
  );
}
