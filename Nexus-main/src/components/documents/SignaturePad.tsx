import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '../ui/Button';
import { Trash2, Check, X, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface SignaturePadProps {
  onSave: (signatureData: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onCancel, isLoading }) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const clear = () => {
    sigCanvas.current?.clear();
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataURL = e.target?.result as string;
        if (dataURL && sigCanvas.current) {
          // Clear current first and load image
          sigCanvas.current.clear();
          sigCanvas.current.fromDataURL(dataURL, {
            callback: () => {
              toast.success('Signature uploaded successfully');
            }
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const save = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Signature save triggered...');
    
    if (sigCanvas.current?.isEmpty()) {
      toast.error('Please provide a signature first');
      return;
    }
    
    const canvas = sigCanvas.current?.getCanvas();
    const signatureData = canvas?.toDataURL('image/png');
    if (signatureData) {
      onSave(signatureData);
    } else {
      toast.error('Failed to capture signature data');
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-2xl border border-gray-200 animate-fade-in max-w-lg w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900">Sign Document</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 overflow-hidden mb-6 flex justify-center">
        <SignatureCanvas
          ref={sigCanvas}
          penColor="black"
          canvasProps={{
            width: 460,
            height: 192,
            className: 'signature-canvas'
          }}
        />
      </div>

      <div className="flex justify-between items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Trash2 size={16} />}
          onClick={clear}
        >
          Clear
        </Button>

        <input
          type="file"
          ref={imageInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleImageUpload}
        />
        <Button
          variant="outline"
          size="sm"
          leftIcon={<ImageIcon size={16} />}
          onClick={() => imageInputRef.current?.click()}
        >
          Upload Image
        </Button>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <button
            onClick={(e) => save(e)}
            disabled={isLoading}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              zIndex: 100,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              border: 'none'
            }}
          >
            {isLoading ? 'Signing...' : 'Confirm Signature'}
          </button>
        </div>
      </div>
      <p className="mt-4 text-xs text-center text-gray-500 italic">
        By signing above, you agree to the terms and conditions of this document.
      </p>
    </div>
  );
};
