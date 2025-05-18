import React, { useState } from 'react';
import { Button, message, Card } from 'antd';

interface AddressInfo {
  name: string;
  wechat: string;
  phone: string;
  default_address: string;
}

interface Props {
  onAddressSelected?: (address: AddressInfo) => void;
  onAddressParseSuccess?: () => void;
}

const AddressParser: React.FC<Props> = ({ onAddressSelected, onAddressParseSuccess }) => {
  const [addressText, setAddressText] = useState('');
  const [parsedAddress, setParsedAddress] = useState<AddressInfo | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const handleParse = async () => {
    if (!addressText.trim()) {
      message.warning('请输入地址信息');
      return;
    }
    
    setIsParsing(true);
    try {
      const response = await fetch('http://localhost:5000/api/customers/parse-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ text: addressText }),
      });

      if (!response.ok) {
        throw new Error('Failed to parse address');
      }

      const data = await response.json();
      setParsedAddress(data);
      message.success('地址解析成功');
    } catch (error) {
      message.error('解析地址失败');
    } finally {
      setIsParsing(false);
    }
  };
  
  const handleSave = async () => {
    if (!parsedAddress) return;
    
    try {
      const saveResponse = await fetch('http://localhost:5000/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedAddress),
      });

      if (saveResponse.ok) {
        message.success('客户信息已保存到数据库');
        if (onAddressSelected) {
          onAddressSelected(parsedAddress);
        }
        if (onAddressParseSuccess) {
          onAddressParseSuccess();
        }
        setAddressText('');
        setParsedAddress(null);
      } else {
        message.error('保存客户信息失败');
      }
    } catch (error) {
      message.error('保存客户信息失败');
    }
  };

  return (
    <div className="space-y-4">
      <textarea
        className="w-full h-32 p-2 border rounded-md"
        placeholder="请粘贴包含姓名、电话和地址的文本，用逗号分隔"
        value={addressText}
        onChange={(e) => setAddressText(e.target.value)}
      />
      <Button 
        type="primary" 
        onClick={handleParse} 
        className="w-full"
        loading={isParsing}
      >
        解析地址
      </Button>
      
      {parsedAddress && (
        <div className="space-y-4">
          <Card title="解析结果" size="small">
            <p><strong>姓名：</strong>{parsedAddress.name}</p>
            <p><strong>电话：</strong>{parsedAddress.phone}</p>
            <p><strong>地址：</strong>{parsedAddress.default_address}</p>
          </Card>
          <Button 
            type="primary" 
            onClick={handleSave} 
            className="w-full"
          >
            保存到数据库
          </Button>
        </div>
      )}
    </div>
  );
};

export default AddressParser;
