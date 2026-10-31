'use client';

import React from 'react';
import { CustomerPortalView } from '@/components/domain/CustomerPortalView';

export default function PortalPreviewPage() {
  return <CustomerPortalView isPreview={true} />;
}
