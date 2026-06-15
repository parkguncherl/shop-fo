'use client';

import React, { useState } from 'react';
import { DeliveryAddress, useDeleteDeliveryAddressMutation } from '@/hooks/useDeliveryAddress';
import { useConfirm } from '@/components/common/ConfirmModal/ConfirmProvider';
import styles from './DeliveryAddressSelector.module.scss';

interface Props {
  addresses: DeliveryAddress[];
  socialAccountId: number;
  onSelect: (address: DeliveryAddress) => void;
  onEdit: (address: DeliveryAddress) => void;
}

export default function DeliveryAddressSelector({ addresses, socialAccountId, onSelect, onEdit }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(
    addresses.find((a) => a.isDefault === 'Y')?.id ?? addresses[0]?.id ?? null,
  );
  const deleteMutation = useDeleteDeliveryAddressMutation();
  const confirm = useConfirm();

  const handleSelect = (address: DeliveryAddress) => {
    setSelectedId(address.id);
    onSelect(address);
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: '배송지 삭제',
      message: '배송지를 삭제하시겠습니까?',
      description: '삭제한 배송지는 다시 복구할 수 없습니다.',
      confirmText: '삭제',
      tone: 'danger',
    });
    if (!confirmed) return;
    await deleteMutation.mutateAsync({ id, socialAccountId });
    if (selectedId === id) setSelectedId(null);
  };

  if (addresses.length === 0) return null;

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>저장된 배송지</p>
      <div className={styles.list}>
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className={`${styles.card} ${selectedId === addr.id ? styles.selected : ''}`}
            onClick={() => handleSelect(addr)}
          >
            <div className={styles.cardTop}>
              <span className={styles.alias}>{addr.alias}</span>
              {addr.isDefault === 'Y' && <span className={styles.defaultBadge}>기본</span>}
              <div className={styles.actions}>
                <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(addr); }}>수정</button>
                <button type="button" onClick={(e) => handleDelete(e, addr.id)}>삭제</button>
              </div>
            </div>
            <p className={styles.name}>{addr.receiverName} · {addr.receiverPhone}</p>
            <p className={styles.address}>{addr.address} {addr.addressDetail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
