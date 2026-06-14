import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/libs/api';

export interface DeliveryAddress {
  id: number;
  socialAccountId: number;
  alias: string;
  receiverName: string;
  receiverPhone: string;
  zipCode: string;
  address: string;
  addressDetail?: string;
  memo?: string;
  isDefault: 'Y' | 'N';
  creTm?: string;
  uptTm?: string;
}

export interface SaveDeliveryAddressPayload {
  socialAccountId: number;
  alias: string;
  receiverName: string;
  receiverPhone: string;
  zipCode: string;
  address: string;
  addressDetail?: string;
  memo?: string;
  isDefault: 'Y' | 'N';
}

export interface UpdateDeliveryAddressPayload extends SaveDeliveryAddressPayload {
  id: number;
}

export const useDeliveryAddressListQuery = (socialAccountId?: number) => {
  return useQuery<DeliveryAddress[]>({
    queryKey: ['deliveryAddresses', socialAccountId],
    enabled: Boolean(socialAccountId),
    queryFn: async () => {
      const { data } = await authApi.get('/frontWeb/delivery-address/list', {
        params: { socialAccountId },
      });
      return data?.body ?? [];
    },
  });
};

export const useSaveDeliveryAddressMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SaveDeliveryAddressPayload) => {
      const { data } = await authApi.post('/frontWeb/delivery-address', payload);
      return data?.body as DeliveryAddress;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deliveryAddresses', variables.socialAccountId] });
    },
  });
};

export const useUpdateDeliveryAddressMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateDeliveryAddressPayload) => {
      const { data } = await authApi.put('/frontWeb/delivery-address', payload);
      return data?.body as DeliveryAddress;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deliveryAddresses', variables.socialAccountId] });
    },
  });
};

export const useDeleteDeliveryAddressMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: number; socialAccountId: number }) => {
      await authApi.delete(`/frontWeb/delivery-address/${id}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deliveryAddresses', variables.socialAccountId] });
    },
  });
};
