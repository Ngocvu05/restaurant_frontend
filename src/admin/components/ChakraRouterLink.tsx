// src/components/ChakraRouterLink.tsx
import { forwardRef } from 'react';
import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router-dom';
import { LinkProps as ChakraLinkProps, Link as ChakraLink } from '@chakra-ui/react';

type Props = Omit<ChakraLinkProps, 'as'> & RouterLinkProps;

const ChakraRouterLink = forwardRef<HTMLAnchorElement, Props>((props, ref) => {
  return <ChakraLink as={RouterLink} ref={ref} {...props} />;
});

export default ChakraRouterLink;
