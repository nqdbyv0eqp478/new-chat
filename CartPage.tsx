import { Box, Typography } from '@mui/material';
import Footer from 'components/Footer/Footer';
import RecommendedCategories from 'features/home/containers/RecommendedCategories/RecommendedCategories';
import { HomePageType } from 'features/home/pages/Home/HomePage';
import { useStore } from 'features/home/store/homeSlice';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import { isRestaurantOpen, isTableNumber } from 'submodules/OrderCore';
import { theme } from 'theme';
import useAnalyticsEventTracker from 'utils/analytics/useAnalyticsEventTracker';
import {
  EEventAction,
  EEventCategory,
  MESSAGE_MERCHANT_IS_NOW_NOT_OPERATING,
} from 'utils/constants';
import { IHandleErrorProps, handleError, handleRouter } from 'utils/restaurantFeatures';
import { useShallow } from 'zustand/react/shallow';
import CartFooter from './components/CartFooter';
import CartHeader from './components/CartHeader';
import CartItem from './components/CartItem/CartItem';
import { useCartStore } from './store/cartSlice';

const TextNoOrder = styled(Typography)`
  font-size: 18px;
  line-height: 24px;
  color: ${theme.palette.grey[800]};
  text-align: center;
`;
const CardList = styled('div')`
  margin-top: 80px;
`;

function CartPage({ type }: any) {
  const { menuId: menuIdParam, tableId: tableIdParam } = useParams<{
    menuId: string;
    tableId: string;
  }>();

  const { state, restaurant, tableId, inactiveMenu, info, setUrlHome } = useStore(
    useShallow((state) => ({
      state: state.homeState,
      restaurant: state.homeState.restaurant,
      tableId: state.homeState.tableId,
      inactiveMenu: state.homeState.inactiveMenu,
      info: state.homeState.info,
      setUrlHome: state.setUrlHome,
    })),
  );

  const { cart, removeItem, switchTakeawayItem, increaseItem, removePlaceOrderResponseAdyen } =
    useCartStore(
      useShallow((state) => ({
        cart: state.cartState.cart,
        removeItem: state.removeItem,
        switchTakeawayItem: state.switchTakeawayItem,
        increaseItem: state.increaseItem,
        removePlaceOrderResponseAdyen: state.removePlaceOrderResponseAdyen,
      })),
    );
  const eventTracker = useAnalyticsEventTracker();
  const [renderData, setRenderData] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const onRemoveItem = (index: number) => {
    removeItem({ index: index, info });
    setRenderData(!renderData);
  };

  const onSwitchTakeawayItem = (index: number) => {
    switchTakeawayItem({ index: index, info });
    setRenderData(!renderData);
  };

  const handleLogError = (error: any, functionName: string) => {
    const errorData: IHandleErrorProps = {
      logErrorData: {
        endpoint: '',
        menuId: menuIdParam || '',
        orderNumber: '',
        tableId: tableIdParam || '',
        error,
        fileName: 'CartPage',
        functionName,
      },
      eventTracker,
    };
    handleError(errorData);
  };

  const isDisableContinue = () => {
    try {
      if (cart?.order && cart.order.items && cart.order.items.length > 0) {
        return false;
      }
      return true;
    } catch (error: any) {
      handleLogError(error, 'isDisableContinue');
      return true;
    }
  };

  const onRouterAddInformation = (customFileName: string) => {
    if (!isDisableContinue()) {
      handleRouter({
        navigate,
        state,
        customUrl: `/add-information`,
        fileName: `CartPage ${customFileName}`,
      });
    }
  };

  const onContinue = () => {
    try {
      if (checkCartSoldOut()) {
        toast.error(t('Your cart has sold out item. Please check your cart.'));
        return;
      }
      if (!isTableNumber(tableId)) {
        onRouterAddInformation('isTableNumber');
      } else if (isRestaurantOpen(restaurant, null, null)) {
        if (!isDisableContinue()) {
          onRouterAddInformation('isRestaurantOpen');
        }
      } else {
        toast.error(<span>{t(MESSAGE_MERCHANT_IS_NOW_NOT_OPERATING)}.</span>);
      }
    } catch (error: any) {
      handleLogError(error, 'onContinue');
    }
  };

  useEffect(() => {
    removePlaceOrderResponseAdyen();
    setUrlHome(`/${type}/${menuIdParam}/${tableIdParam}`, menuIdParam || '', tableIdParam || '');
    const temp = document?.getElementById('cartPage');
    if (temp) {
      temp.scrollIntoView();
    }
    eventTracker(
      EEventCategory.SHOPPING_CART_LOADING_EVENTS,
      EEventAction.CHECK,
      window?.location?.href || '',
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkCartSoldOut = () => {
    const result = cart?.order?.items.find((item) => {
      return inactiveMenu?.includes(item.dish.id);
    });
    return !!result;
  };

  const onIncreaseItem = (index: number) => {
    increaseItem({ index: index, info });
    setRenderData(!renderData);
  };

  return (
    <Box id="cartpage">
      <CartHeader onContinue={onContinue} isDisableContinue={isDisableContinue} type={type} />
      <CardList>
        {(cart?.order?.items.length === 0 || !cart?.order?.items) && (
          <TextNoOrder>{t('No item')}</TextNoOrder>
        )}
        {cart?.order?.items?.map((item, index) => (
          <CartItem
            onRemoveItem={onRemoveItem}
            onIncreaseItem={onIncreaseItem}
            key={index}
            cartItem={item}
            index={index}
            tableId={tableId}
            onSwitchTakeawayItem={onSwitchTakeawayItem}
            restaurant={restaurant}
            isSoldOut={inactiveMenu?.includes(item.dish.id)}
          />
        ))}
        {cart?.order?.items.length > 0 && (
          <CartFooter restaurant={restaurant} subTotal={cart?.order?.total} />
        )}
      </CardList>
      <RecommendedCategories title="You might also like" dot={false} />
      <Footer />
    </Box>
  );
}

export default CartPage;
