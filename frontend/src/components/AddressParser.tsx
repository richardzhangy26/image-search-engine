import React, { useState } from 'react';
import { Button, message, Card, Input, Form } from 'antd';

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
  const [form] = Form.useForm<AddressInfo>();

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
      form.setFieldsValue(data);
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
      const values = await form.validateFields();
      const saveResponse = await fetch('http://localhost:5000/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (saveResponse.ok) {
        if (saveResponse.status === 201) {
          message.success('新客户已创建');
        } else {
          message.success('客户信息已更新');
        }

        if (onAddressSelected) {
          onAddressSelected(values);
        }
        if (onAddressParseSuccess) {
          onAddressParseSuccess();
        }
        setAddressText('');
        setParsedAddress(null);
      } else {
        const errorData = await saveResponse.json();
        message.error(errorData.error || '保存客户信息失败');
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
        <Form form={form} layout="vertical" initialValues={parsedAddress}>
          <Card title="解析结果" size="small">
            <Form.Item
              name="name"
              label="姓名"
              rules={[{ required: true, message: '请输入姓名' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="phone"
              label="电话"
              rules={[
                { required: true, message: '请输入电话' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号码' }
              ]}
            >
              <Input maxLength={11} placeholder="请输入11位手机号码" />
            </Form.Item>
            <Form.Item
              name="default_address"
              label="地址"
              rules={[{ required: true, message: '请输入地址' }]}
            >
              <Input.TextArea rows={3} />
            </Form.Item>
          </Card>
          <Button 
            type="primary" 
            onClick={handleSave} 
            className="w-full mt-4"
          >
            保存到数据库
          </Button>
        </Form>
      )}
    </div>
  );
};

export default AddressParser;
