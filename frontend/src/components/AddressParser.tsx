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
}

const AddressParser: React.FC<Props> = ({ onAddressSelected }) => {
  const [addressText, setAddressText] = useState('');
  const [parsedAddress, setParsedAddress] = useState<AddressInfo | null>(null);

  const handleParse = async () => {
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
      
      // 自动保存到数据库
      if (data) {
        const saveResponse = await fetch('http://localhost:5000/api/customers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (saveResponse.ok) {
          message.success('客户信息已保存到数据库');
          if (onAddressSelected) {
            onAddressSelected(data);
          }
          setAddressText('');
          setParsedAddress(null);
        } else {
          message.error('保存客户信息失败');
        }
      }
    } catch (error) {
      message.error('解析地址失败');
    }
  };

  return (
    <div className="space-y-4">
      <textarea
        className="w-full h-32 p-2 border rounded-md"
        placeholder="请粘贴包含姓名、微信号、电话和地址的文本，用逗号分隔"
        value={addressText}
        onChange={(e) => setAddressText(e.target.value)}
      />
      <Button type="primary" onClick={handleParse} className="w-full">
        解析并保存
      </Button>
      
      {parsedAddress && (
        <Card title="解析结果" size="small">
          <p><strong>姓名：</strong>{parsedAddress.name}</p>
          <p><strong>微信号：</strong>{parsedAddress.wechat}</p>
          <p><strong>电话：</strong>{parsedAddress.phone}</p>
          <p><strong>地址：</strong>{parsedAddress.default_address}</p>
        </Card>
      )}
    </div>
  );
};

export default AddressParser;
