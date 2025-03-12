'use client';

import React from 'react';
import ClientWrapper from './ClientWrapper';
import type { ClientWrapperProps } from './ClientWrapper';

/**
 * クライアント/サーバー境界を設定するためのラッパーコンポーネント
 * サーバーコンポーネントからクライアントコンポーネントを分離するために使用します
 */
const ClientBoundary: React.FC<ClientWrapperProps> = (props) => {
  return <ClientWrapper {...props} />;
};

export default ClientBoundary;
