-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Mar 31, 2025 at 06:45 PM
-- Server version: 10.6.21-MariaDB-cll-lve
-- PHP Version: 8.3.19

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `mrtzoalg_drop`
--

-- --------------------------------------------------------

--
-- Table structure for table `addbank`
--

CREATE TABLE `addbank` (
  `id` int(11) NOT NULL,
  `country` varchar(100) NOT NULL,
  `bank` varchar(100) NOT NULL,
  `identification_type` varchar(50) NOT NULL,
  `identification_number` varchar(100) NOT NULL,
  `account_type` varchar(50) NOT NULL,
  `interbank_number` varchar(100) NOT NULL,
  `user_uuid` varchar(36) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `addbank`
--

INSERT INTO `addbank` (`id`, `country`, `bank`, `identification_type`, `identification_number`, `account_type`, `interbank_number`, `user_uuid`) VALUES
(1, 'CO', 'ACH COLOMBIA S.A.', 'Carné de Extranjería', '234342321', 'Cuenta de Ahorros', '1234123424', 'e6ae9003-e23e-4ee1-b4cb-9ce42c6f2cac');

-- --------------------------------------------------------

--
-- Table structure for table `carriers`
--

CREATE TABLE `carriers` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `carriers`
--

INSERT INTO `carriers` (`id`, `name`, `logo_url`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'EVACOURIER', 'https://example.com/logos/evacourier.png', 1, '2025-03-02 17:22:36', '2025-03-02 17:22:36'),
(2, 'URBANO', 'https://example.com/logos/urbano.png', 1, '2025-03-02 17:22:36', '2025-03-02 17:22:36'),
(3, 'FENIX', 'https://example.com/logos/fenix.png', 1, '2025-03-02 17:22:36', '2025-03-02 17:22:36');

-- --------------------------------------------------------

--
-- Table structure for table `carriers_order`
--

CREATE TABLE `carriers_order` (
  `id` int(11) NOT NULL,
  `user_uuid` varchar(36) NOT NULL,
  `carrier_name` varchar(100) NOT NULL,
  `carrier_order` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `carriers_order`
--

INSERT INTO `carriers_order` (`id`, `user_uuid`, `carrier_name`, `carrier_order`) VALUES
(4, 'e6ae9003-e23e-4ee1-b4cb-9ce42c6f2cac', 'URBANO', 1),
(5, 'e6ae9003-e23e-4ee1-b4cb-9ce42c6f2cac', 'FENIX', 2),
(6, 'e6ae9003-e23e-4ee1-b4cb-9ce42c6f2cac', 'EVACOURIER', 3);

-- --------------------------------------------------------

--
-- Table structure for table `carrier_preferences`
--

CREATE TABLE `carrier_preferences` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `carrier_id` int(11) NOT NULL,
  `order` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ciudades`
--

CREATE TABLE `ciudades` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `departamento_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ciudades`
--

INSERT INTO `ciudades` (`id`, `nombre`, `departamento_id`) VALUES
(1, 'Medellín', 1),
(2, 'Envigado', 1),
(3, 'Bogotá', 2),
(4, 'Soacha', 2),
(5, 'Cali', 3),
(6, 'Palmira', 3),
(7, 'Barranquilla', 4),
(8, 'Soledad', 4);

-- --------------------------------------------------------

--
-- Table structure for table `clientes`
--

CREATE TABLE `clientes` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `telefono` varchar(20) NOT NULL,
  `correo` varchar(150) NOT NULL,
  `identificacion` varchar(50) NOT NULL,
  `direccion1` varchar(255) NOT NULL,
  `direccion2` varchar(255) DEFAULT NULL,
  `departamento_id` int(11) NOT NULL,
  `ciudad_id` int(11) NOT NULL,
  `user_uuid` varchar(36) NOT NULL DEFAULT 'uuid()',
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `clientes`
--

INSERT INTO `clientes` (`id`, `nombre`, `apellido`, `telefono`, `correo`, `identificacion`, `direccion1`, `direccion2`, `departamento_id`, `ciudad_id`, `user_uuid`, `fecha_registro`) VALUES
(1, 'test', 'test', '8972398742', 'test@gmail.com', '289748923', 'ksjdkhjsdknck', 'sdklfjskdjf', 4, 7, 'e6ae9003-e23e-4ee1-b4cb-9ce42c6f2cac', '2025-03-12 06:00:50'),
(2, 'klasjdlk', 'cskldnckl', '87123689732', 'skjcnskl@msdnbckj', 'skncsdklc', 'jkshcjks', 'skdnclk', 2, 3, 'e6ae9003-e23e-4ee1-b4cb-9ce42c6f2cac', '2025-03-12 06:06:49'),
(3, 'jksfhkjv', 'fxkbjfkhvkljf', '876287463', 'jakcjksdhvkj@kdjhjkdf', 'jvdfjkfhjsdkhfjk', 'kajhcdsjhvjks', 'ksdjbfjksdbfsdk', 4, 8, 'e6ae9003-e23e-4ee1-b4cb-9ce42c6f2cac', '2025-03-12 06:11:16'),
(4, 'asjkdjsb', 'dsfbshjdb', 'jskcbsjk', 'sjdbkjhcb@skdjbc', 'sdmbcjksd', 'cjksdbnvjdk', 'clksdndsjnvj', 2, 4, 'e6ae9003-e23e-4ee1-b4cb-9ce42c6f2cac', '2025-03-12 06:19:44'),
(5, 'lkscklsflkv', 'kfjnklnkjcnk', '89234789', 'asbxkjxnasjk@kjfnkewl', '892374', 'klfklcklnsf', 'ewjknfjkwn', 4, 8, 'e6ae9003-e23e-4ee1-b4cb-9ce42c6f2cac', '2025-03-13 00:04:56'),
(6, 'kcnsdklcn2222', 'sjcdknkjsd222', '89234987222', 'lkxakla@dklcnkd22', '892378229', 'dqjkndejwkn22', 'lknfwenf22', 1, 2, 'e6ae9003-e23e-4ee1-b4cb-9ce42c6f2cac', '2025-03-13 00:05:31'),
(18, 'test', 'test', '893574938', 'test@tes', '982374', 'akscnjkdn', 'kjdnfjek', 4, 7, '2eeb8bd0-7d6b-4f4c-a615-4396974fb9ef', '2025-03-17 20:46:45');

-- --------------------------------------------------------

--
-- Table structure for table `departamentos`
--

CREATE TABLE `departamentos` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `departamentos`
--

INSERT INTO `departamentos` (`id`, `name`) VALUES
(1, 'Antioquia'),
(4, 'Atlántico'),
(2, 'Cundinamarca'),
(3, 'Valle del Cauca');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` varchar(36) NOT NULL,
  `user_id` int(11) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'PENDIENTE',
  `total_amount` decimal(10,2) NOT NULL,
  `shipping_address` text NOT NULL,
  `shipping_city` varchar(100) NOT NULL,
  `shipping_department` varchar(100) NOT NULL,
  `shipping_country` varchar(100) NOT NULL DEFAULT 'Peru',
  `customer_name` varchar(255) NOT NULL,
  `customer_email` varchar(255) NOT NULL,
  `customer_phone` varchar(20) NOT NULL,
  `carrier_id` int(11) DEFAULT NULL,
  `tracking_number` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `collect_on_delivery` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` varchar(36) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pedidos`
--

CREATE TABLE `pedidos` (
  `id` int(11) NOT NULL,
  `user_uuid` varchar(36) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `telefono` varchar(50) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `direccion` varchar(255) NOT NULL,
  `con_recaudo` tinyint(1) NOT NULL DEFAULT 0,
  `producto_id` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_venta` decimal(10,2) NOT NULL,
  `transportadora` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `productos`
--

CREATE TABLE `productos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `categoria` varchar(100) NOT NULL,
  `proveedor` varchar(100) NOT NULL,
  `precio_proveedor` decimal(10,2) NOT NULL,
  `precio_sugerido` decimal(10,2) NOT NULL,
  `stock` int(11) NOT NULL,
  `imagen` varchar(255) NOT NULL,
  `user_uuid` varchar(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `productos`
--

INSERT INTO `productos` (`id`, `nombre`, `categoria`, `proveedor`, `precio_proveedor`, `precio_sugerido`, `stock`, `imagen`, `user_uuid`) VALUES
(1, 'Cadena con Clave', 'Herramientas', 'MAYORISTAS', 7.70, 35.00, 300, 'https://images.unsplash.com/photo-1541873676-a18131494184?w=300&q=80', NULL),
(2, 'Audifono Bluetooth F9', 'Tecnología', 'MARCO', 33.00, 50.00, 15, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80', NULL),
(3, 'Liveri', 'Salud', 'UNMERCO', 33.00, 99.00, 497, 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=300&q=80', NULL),
(4, 'Calefactor Para Autos', 'Tecnología', 'VOCH', 31.00, 78.00, 498, 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=300&q=80', NULL),
(5, 'Pulsera Luna', 'Belleza', 'BARATISIMO', 11.00, 69.00, 271, 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&q=80', NULL),
(6, 'paisaje', 'paisaje', 'test', 10.00, 15.00, 1500, 'https://dropi.co.alexcode.org/public/uploads/1742171640828-p1.avif', '2eeb8bd0-7d6b-4f4c-a615-4396974fb9ef'),
(7, 'camisa', 'ropa', 'test', 43.00, 100.00, 120, 'https://dropi.co.alexcode.org/public/uploads/1742171630585-Captura de pantalla 2025-03-16 a las 11.46.37â¯a.â¯m..png', '2eeb8bd0-7d6b-4f4c-a615-4396974fb9ef'),
(8, 'pared', 'pared', 'test', 234.00, 234.00, 2342, 'https://dropi.co.alexcode.org/public/uploads/1742170756898-freepik__a-cartoon-illustration-of-a-fairy-tale-taking-plac__68865.jpeg', '2eeb8bd0-7d6b-4f4c-a615-4396974fb9ef'),
(9, 'spotify', 'music', 'test', 134.00, 2345.00, 233, 'https://dropi.co.alexcode.org/public/uploads/1742268083273-p1.avif', '2eeb8bd0-7d6b-4f4c-a615-4396974fb9ef');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `provider_id` int(11) NOT NULL,
  `provider_price` decimal(10,2) NOT NULL,
  `suggested_price` decimal(10,2) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `category_id` int(11) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `is_private` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `description`, `provider_id`, `provider_price`, `suggested_price`, `stock`, `category_id`, `image_url`, `is_active`, `is_private`, `created_at`, `updated_at`) VALUES
(1, 'Cadena Con Clave', 'Cadena de alta calidad con clave de seguridad', 1, 7.70, 35.00, 300, 1, 'https://images.unsplash.com/photo-1541873676-a18131494184?w=300&q=80', 1, 0, '2025-03-10 05:23:33', '2025-03-10 05:23:33'),
(2, 'Audifono Bluetooth F9', 'Audífonos inalámbricos con cancelación de ruido', 2, 33.00, 50.00, 15, 2, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80', 1, 0, '2025-03-10 05:23:33', '2025-03-10 05:23:33'),
(3, 'Liveri', 'Suplemento vitamínico para el hígado', 3, 33.00, 99.00, 497, 3, 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=300&q=80', 1, 0, '2025-03-10 05:23:33', '2025-03-10 05:23:33'),
(4, 'Calefactor Para Autos', 'Calefactor portátil para vehículos', 4, 31.00, 78.00, 498, 2, 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=300&q=80', 1, 0, '2025-03-10 05:23:33', '2025-03-10 05:23:33'),
(5, 'Pulsera Luna', 'Pulsera de moda con diseño de luna', 5, 11.00, 69.00, 271, 4, 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&q=80', 1, 0, '2025-03-10 05:23:33', '2025-03-10 05:23:33');

-- --------------------------------------------------------

--
-- Table structure for table `retiros`
--

CREATE TABLE `retiros` (
  `id` int(11) NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `banco` varchar(100) NOT NULL,
  `numero_solicitud` varchar(50) NOT NULL,
  `fecha_solicitud` datetime NOT NULL,
  `fecha_cierre` datetime DEFAULT NULL,
  `estado` varchar(50) NOT NULL,
  `cuenta` varchar(100) NOT NULL,
  `user_uuid` varchar(36) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `retiros`
--

INSERT INTO `retiros` (`id`, `monto`, `banco`, `numero_solicitud`, `fecha_solicitud`, `fecha_cierre`, `estado`, `cuenta`, `user_uuid`) VALUES
(1, 1000.00, 'Interbank', 'R1741848481356', '2025-03-13 02:48:01', NULL, 'Pendiente', '9587934878958367', 'e6ae9003-e23e-4ee1-b4cb-9ce42c6f2cac');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`) VALUES
(1, 'ADMIN'),
(2, 'DROPSHIPPER'),
(3, 'PROVEEDOR / MARCA');

-- --------------------------------------------------------

--
-- Table structure for table `sesiones`
--

CREATE TABLE `sesiones` (
  `id` int(11) NOT NULL,
  `user_uuid` varchar(36) NOT NULL,
  `date_time_login` datetime NOT NULL,
  `browser` varchar(50) DEFAULT '',
  `os` varchar(50) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `sesiones`
--

INSERT INTO `sesiones` (`id`, `user_uuid`, `date_time_login`, `browser`, `os`) VALUES
(7, 'e6ae9003-e23e-4ee1-b4cb-9ce42c6f2cac', '2025-03-16 13:39:19', 'Chrome', 'Mac OS X'),
(8, 'cea7fbc2-0b58-4b14-8922-6bc12fc39178', '2025-03-17 00:53:54', 'Chrome', 'Mac OS X'),
(9, '2eeb8bd0-7d6b-4f4c-a615-4396974fb9ef', '2025-03-20 13:05:50', 'Chrome', 'Mac OS X'),
(10, '8d447086-39bd-4bec-9645-b02d54faf68a', '2025-03-16 13:09:19', 'Chrome', 'Mac OS X'),
(11, '2eeb8bd0-7d6b-4f4c-a615-4396974fb9ef', '2025-03-17 19:40:59', 'Other', 'Other'),
(12, 'f70e736f-cae0-468e-afc5-76c26984509e', '2025-03-17 22:11:32', 'Chrome Mobile', 'Android'),
(13, 'f70e736f-cae0-468e-afc5-76c26984509e', '2025-03-19 11:27:49', 'Chrome', 'Windows'),
(14, '45c45480-2213-4598-b37f-b01164f026d7', '2025-03-18 14:51:10', 'Chrome', 'Windows'),
(15, 'f70e736f-cae0-468e-afc5-76c26984509e', '2025-03-26 11:10:14', 'Chrome', 'Linux');

-- --------------------------------------------------------

--
-- Table structure for table `stores`
--

CREATE TABLE `stores` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `categories` text NOT NULL,
  `imagen` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `user_uuid` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `activacion` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stores`
--

INSERT INTO `stores` (`id`, `name`, `categories`, `imagen`, `created_at`, `user_uuid`, `user_id`, `activacion`) VALUES
(11, 'test', 'test', NULL, '2025-03-16 17:06:14', '2eeb8bd0-7d6b-4f4c-a615-4396974fb9ef', 23, 1),
(14, 'SHOP', 'ropa,juguetes,tecnologia,moda,belleza,libros', 'https://dropi.co.alexcode.org/suppliers/1742187440846-freepik__a-cartoon-illustration-of-a-fairy-tale-taking-plac__68865.jpeg', '2025-03-17 04:57:20', 'cea7fbc2-0b58-4b14-8922-6bc12fc39178', 23, 1);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `country_code` varchar(5) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `account_type` enum('dropshipper','proveedor') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `role_id` int(11) DEFAULT 2,
  `last_login` timestamp NULL DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expiry` timestamp NULL DEFAULT NULL,
  `uuid` varchar(36) NOT NULL DEFAULT uuid(),
  `address` varchar(255) DEFAULT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `imagen` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `last_name`, `first_name`, `country_code`, `phone`, `email`, `password`, `account_type`, `created_at`, `updated_at`, `role_id`, `last_login`, `status`, `reset_token`, `reset_token_expiry`, `uuid`, `address`, `profile_image`, `imagen`) VALUES
(1, 'Doe', 'John', '1', '1234567890', 'john.doe@example.com', '$2a$12$yQJs6.bDBQw8rnYb/nbEzuEAdp7K5Pj8T2e9wDSCNTOZlH/TEyYIu', 'dropshipper', '2025-02-04 04:43:43', '2025-02-04 05:24:04', 1, NULL, 'OFF', NULL, NULL, '9ad96afa-fd3c-11ef-9414-22ee0e8172e7', NULL, NULL, NULL),
(2, 'Nieves', 'Alexander', '57', '944918994', 'elemax.store.io@gmail.com', '$2a$12$nnCi7FSxG22Nv2Pna8hIzeuSfznb.SohAHDzGIUQzkVmCXWxikNua', 'dropshipper', '2025-02-04 05:12:32', '2025-02-04 05:12:32', 2, NULL, 'OFF', NULL, NULL, '9ad96ba4-fd3c-11ef-9414-22ee0e8172e7', NULL, NULL, NULL),
(3, 'Grill', 'Terraza', '57', '5345345334', 'alidismaza6@gmail.com', '$2a$12$H78U/RAXWOBhWsIk29A7wuS83fCCH5R0QZoRPX90tkDQZcxALaUB.', 'proveedor', '2025-02-04 05:13:44', '2025-02-04 05:24:04', 3, NULL, 'OFF', NULL, NULL, '9ad96c12-fd3c-11ef-9414-22ee0e8172e7', NULL, NULL, NULL),
(4, 'Grill', 'Terraza', '57', '242342343', 'angeldvelasco.99@gmail.com', '$2a$12$5Y0jouttV0MdMJjl82PRlOzkAwcjB/Enxlt9PpMUEApcbx8XRClTO', 'proveedor', '2025-02-04 17:16:29', '2025-02-04 17:16:29', 2, NULL, 'OFF', NULL, NULL, '9ad96c58-fd3c-11ef-9414-22ee0e8172e7', NULL, NULL, NULL),
(5, 'maza barroso', 'alidis katiuska', '52', '3055923972', 'raizamontilva00@gmail.com', '$2a$12$NHTtOHR2ObkasVa8U..LDu9qnFB8aii//6RNcQ4AV/vuWnybLSj1S', 'dropshipper', '2025-02-04 17:26:31', '2025-03-09 23:06:49', 2, '2025-02-04 17:50:49', 'ON', NULL, NULL, '9ad96ca8-fd3c-11ef-9414-22ee0e8172e7', NULL, NULL, NULL),
(7, 'user10', 'user10', '57', '8437532987534', 'user10@gmail.com', 'zxcvbnm', 'dropshipper', '2025-03-09 16:35:13', '2025-03-09 16:35:13', NULL, NULL, 'A', NULL, NULL, '9ad96cee-fd3c-11ef-9414-22ee0e8172e7', NULL, NULL, NULL),
(8, 'user11', 'user11', '57', '908645986', 'user11@gmail.com', '$2b$10$24DkGdrLoiR6p8RBtZhwtOY0PvxrONdnGuBYMZRBqekV/T7/9wSw6', 'dropshipper', '2025-03-09 16:50:41', '2025-03-09 16:50:41', NULL, NULL, 'OFF', NULL, NULL, '9ad96d34-fd3c-11ef-9414-22ee0e8172e7', NULL, NULL, NULL),
(9, 'user12', 'user12', '57', '349504390', 'user12@gmail.com', '$2b$10$8wn/1oyiFjORVmmKY6JCWuDTJHJJ8/C0ZK47oyJ/jUua0evU3IsB.', 'dropshipper', '2025-03-09 16:57:54', '2025-03-09 16:57:54', NULL, NULL, 'OFF', NULL, NULL, '9ad96d70-fd3c-11ef-9414-22ee0e8172e7', NULL, NULL, NULL),
(10, 'user13', 'user13', '57', '2948523098', 'user13@gmail.com', '$2b$10$Nt0W9tygSPner1OEySwHju17I24VCguR1.lgBTW.XJAe/ifNbwelm', 'dropshipper', '2025-03-09 17:00:20', '2025-03-09 17:00:20', NULL, NULL, 'OFF', NULL, NULL, '9ad96dac-fd3c-11ef-9414-22ee0e8172e7', NULL, NULL, NULL),
(11, 'user14', 'user14', '57', '2985904385', 'user14@gmail.com', '$2b$10$L2poohlezaW4q.3m7yz0CeFmorzKmwSxr/3as9MAFQrYKATPC7iZ.', 'dropshipper', '2025-03-09 17:10:10', '2025-03-09 17:10:10', NULL, NULL, 'OFF', NULL, NULL, '9ad96df2-fd3c-11ef-9414-22ee0e8172e7', NULL, NULL, NULL),
(12, 'user15', 'user15', '57', '82739482357', 'user15@gmail.com', '$2b$10$HCe5Nnjd0JzZvhuNuAMUm.YiXoSUYofo73KnXfCgiveJE0Sm2C62i', 'dropshipper', '2025-03-09 17:15:12', '2025-03-09 17:15:12', 2, NULL, 'OFF', NULL, NULL, '9ad96e74-fd3c-11ef-9414-22ee0e8172e7', NULL, NULL, NULL),
(13, 'user16', 'user16', '57', '29380590458', 'user16@gmail.com', '$2b$10$zeDULdsmoIz6OY2aqXzrFeLKt9J9L/SRHIEzafWJQTheED47D8Svu', 'dropshipper', '2025-03-09 17:22:31', '2025-03-09 17:22:31', 2, NULL, 'ON', NULL, NULL, '9ad96ed8-fd3c-11ef-9414-22ee0e8172e7', NULL, NULL, NULL),
(14, 'user17', 'user17', '57', '893257349', 'user17@gmail.com', '$2b$10$/.jgSGYm0Vwne0WCFXxn9epjVIw4aEzdIw9f7Fyov1jV6FhA4VLsC', 'dropshipper', '2025-03-09 17:32:34', '2025-03-09 17:32:34', 2, NULL, 'ON', NULL, NULL, '9ad96f32-fd3c-11ef-9414-22ee0e8172e7', NULL, NULL, NULL),
(15, 'test', 'testeando', '57', '8973458374', 'user18@gmail.com', '$2b$10$x6pi3BQKNZjoQ3laFdWaW.ad3t1wQVZ8le8Gq0jaTAVcIJM1BpWS6', 'dropshipper', '2025-03-09 17:43:45', '2025-03-10 01:52:18', 2, '2025-03-10 01:52:04', 'ON', NULL, NULL, '9ad96faa-fd3c-11ef-9414-22ee0e8172e7', 'testing', NULL, NULL),
(16, 'user20', 'user20', '57', '283974823', 'user20@gmail.com', '$2b$10$9IN91QOv0C3ii7kdyTIiwusAjNnaRFAnrYNO2NgE/sKVMVXW3Rvfy', 'dropshipper', '2025-03-09 19:33:07', '2025-03-09 19:41:26', 2, '2025-03-09 19:41:26', 'ON', NULL, NULL, '9ad97018-fd3c-11ef-9414-22ee0e8172e7', NULL, NULL, NULL),
(17, 'user21', 'user21', '57', '9345894376', 'user21@gmail.com', '$2b$10$R1/6pW6Snce11mQ8uApbc.yFJsD9IhYgPcw9ssKVwk90kPfKH5YkK', 'dropshipper', '2025-03-10 00:04:39', '2025-03-10 00:21:01', 2, '2025-03-10 00:21:01', 'ON', NULL, NULL, 'c7db07d4-bd6a-4206-ab76-755c8defb7f8', NULL, NULL, NULL),
(18, 'user100', 'user100', '57', '989438093', 'user100@gmail.com', '$2b$10$Z20eVnObojEpkUl064wPD..JHd7Lg7MqXjPXQIGP5gudjniIKMaWq', 'dropshipper', '2025-03-10 01:53:25', '2025-03-10 04:14:53', 2, '2025-03-10 04:14:53', 'ON', NULL, NULL, '7d40a790-c7f8-4a17-9e4e-572a0eebec92', 'user100', NULL, NULL),
(19, 'testing1', 'testing1', '57', '43565463324', 'testing1@gmail.com', '$2b$10$07hM6NyxeF/KVouQIb93auNq61zduOIGPAxxnAHbvxFUjuRH/W2Uy', 'dropshipper', '2025-03-10 22:23:44', '2025-03-10 22:23:59', 2, '2025-03-10 22:23:59', 'ON', NULL, NULL, '9f9a3c4e-1098-4a94-b3c7-df4652d0edf1', NULL, NULL, NULL),
(20, 'men1', 'men1', '57', '9038590486', 'men1@gmail.com', '$2b$10$2FgQylivmIKG5syIm3F4OOaTlwB5T5qlNE9sNT6uJJKyG0DWz/fPy', 'dropshipper', '2025-03-11 17:21:28', '2025-03-16 17:09:19', 2, '2025-03-16 17:09:19', 'ON', NULL, NULL, '8d447086-39bd-4bec-9645-b02d54faf68a', NULL, NULL, NULL),
(21, 'men2', 'men2', '57', '968574764', 'men2@gmail.com', '$2b$10$/JtVNI5pi5kenuNQ9ohxee4TQNHrj2EFiFF8ibVaqODRM17AEiYoG', 'dropshipper', '2025-03-11 17:42:31', '2025-03-16 17:39:19', 2, '2025-03-16 17:39:19', 'ON', NULL, NULL, 'e6ae9003-e23e-4ee1-b4cb-9ce42c6f2cac', 'tesr2', NULL, NULL),
(22, 'men3', 'men3', '57', '254345363', 'men3@gmail.com', '$2b$10$Yp0y.quNcOW6/aJuH7cGUudEUMnyxEg7MLCIAiWgwZ8LLF54kUWY2', 'proveedor', '2025-03-13 23:34:02', '2025-03-18 01:18:49', 3, '2025-03-17 04:53:54', 'ON', NULL, NULL, 'cea7fbc2-0b58-4b14-8922-6bc12fc39178', '', NULL, 'https://dropi.co.alexcode.org/public/profile/1742192576329-p1.avif'),
(23, 'men4', 'men4', '57', '3894573894', 'men4@gmail.com', '$2b$10$RmNxrvmRFmucKAzOABUKYePmUE83wjHmti2uE3yT4vhm64HDsuxIu', 'dropshipper', '2025-03-16 15:41:51', '2025-03-20 17:05:50', 3, '2025-03-20 17:05:50', 'ON', NULL, NULL, '2eeb8bd0-7d6b-4f4c-a615-4396974fb9ef', '', NULL, 'https://dropi.co.alexcode.org/public/profile/1742244150378-freepik__a-cartoon-illustration-of-a-fairy-tale-taking-plac__68865.jpeg'),
(24, 'MOLINA', 'CAMILO', '57', '3222392645', 'kam312@gmail.com', '$2b$10$HkO4mz36fvrSvgPhKZrf9OQM.Oxq/FsySlx3RRTp.DpiF7D6yM7uq', 'dropshipper', '2025-03-18 02:11:19', '2025-03-26 15:10:14', 2, '2025-03-26 15:10:14', 'ON', NULL, NULL, 'f70e736f-cae0-468e-afc5-76c26984509e', NULL, NULL, NULL),
(25, 'phenox', 'An', '57', '3028650005', 'phenoxan@gmail.com', '$2b$10$Hu.UR20EH3mT8MXcj/Ud/OtBpUt4G4tJnibB2h8KSRz4EBXvZ829K', 'dropshipper', '2025-03-18 18:50:51', '2025-03-18 18:51:10', 2, '2025-03-18 18:51:10', 'ON', NULL, NULL, '45c45480-2213-4598-b37f-b01164f026d7', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `warranties`
--

CREATE TABLE `warranties` (
  `id` varchar(36) NOT NULL,
  `order_id` varchar(36) NOT NULL,
  `product_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'PENDIENTE',
  `description` text NOT NULL,
  `type` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `warranty_collections`
--

CREATE TABLE `warranty_collections` (
  `id` varchar(36) NOT NULL,
  `warranty_id` varchar(36) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'PENDIENTE',
  `collection_address` text NOT NULL,
  `collection_city` varchar(100) NOT NULL,
  `collection_department` varchar(100) NOT NULL,
  `collection_date` date NOT NULL,
  `collection_time_slot` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `warranty_shipments`
--

CREATE TABLE `warranty_shipments` (
  `id` varchar(36) NOT NULL,
  `warranty_id` varchar(36) NOT NULL,
  `carrier_id` int(11) NOT NULL,
  `tracking_number` varchar(100) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'PENDIENTE',
  `destination_address` text NOT NULL,
  `destination_city` varchar(100) NOT NULL,
  `destination_department` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `addbank`
--
ALTER TABLE `addbank`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `carriers`
--
ALTER TABLE `carriers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `carriers_order`
--
ALTER TABLE `carriers_order`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `carrier_preferences`
--
ALTER TABLE `carrier_preferences`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_carrier_unique` (`user_id`,`carrier_id`),
  ADD KEY `carrier_id` (`carrier_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `parent_id` (`parent_id`);

--
-- Indexes for table `ciudades`
--
ALTER TABLE `ciudades`
  ADD PRIMARY KEY (`id`),
  ADD KEY `departamento_id` (`departamento_id`);

--
-- Indexes for table `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `correo` (`correo`),
  ADD UNIQUE KEY `identificacion` (`identificacion`),
  ADD KEY `departamento_id` (`departamento_id`),
  ADD KEY `ciudad_id` (`ciudad_id`);

--
-- Indexes for table `departamentos`
--
ALTER TABLE `departamentos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`name`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `pedidos`
--
ALTER TABLE `pedidos`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `provider_id` (`provider_id`);

--
-- Indexes for table `retiros`
--
ALTER TABLE `retiros`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `sesiones`
--
ALTER TABLE `sesiones`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `stores`
--
ALTER TABLE `stores`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `uuid` (`uuid`),
  ADD KEY `role_id` (`role_id`);

--
-- Indexes for table `warranties`
--
ALTER TABLE `warranties`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `warranty_collections`
--
ALTER TABLE `warranty_collections`
  ADD PRIMARY KEY (`id`),
  ADD KEY `warranty_id` (`warranty_id`);

--
-- Indexes for table `warranty_shipments`
--
ALTER TABLE `warranty_shipments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `warranty_id` (`warranty_id`),
  ADD KEY `carrier_id` (`carrier_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `addbank`
--
ALTER TABLE `addbank`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `carriers`
--
ALTER TABLE `carriers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `carriers_order`
--
ALTER TABLE `carriers_order`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `carrier_preferences`
--
ALTER TABLE `carrier_preferences`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ciudades`
--
ALTER TABLE `ciudades`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `departamentos`
--
ALTER TABLE `departamentos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pedidos`
--
ALTER TABLE `pedidos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `productos`
--
ALTER TABLE `productos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `retiros`
--
ALTER TABLE `retiros`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `sesiones`
--
ALTER TABLE `sesiones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `stores`
--
ALTER TABLE `stores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `carrier_preferences`
--
ALTER TABLE `carrier_preferences`
  ADD CONSTRAINT `carrier_preferences_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `carrier_preferences_ibfk_2` FOREIGN KEY (`carrier_id`) REFERENCES `carriers` (`id`);

--
-- Constraints for table `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`);

--
-- Constraints for table `ciudades`
--
ALTER TABLE `ciudades`
  ADD CONSTRAINT `ciudades_ibfk_1` FOREIGN KEY (`departamento_id`) REFERENCES `departamentos` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `clientes`
--
ALTER TABLE `clientes`
  ADD CONSTRAINT `clientes_ibfk_1` FOREIGN KEY (`departamento_id`) REFERENCES `departamentos` (`id`),
  ADD CONSTRAINT `clientes_ibfk_2` FOREIGN KEY (`ciudad_id`) REFERENCES `ciudades` (`id`);

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`provider_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);

--
-- Constraints for table `warranties`
--
ALTER TABLE `warranties`
  ADD CONSTRAINT `warranties_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  ADD CONSTRAINT `warranties_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  ADD CONSTRAINT `warranties_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `warranty_collections`
--
ALTER TABLE `warranty_collections`
  ADD CONSTRAINT `warranty_collections_ibfk_1` FOREIGN KEY (`warranty_id`) REFERENCES `warranties` (`id`);

--
-- Constraints for table `warranty_shipments`
--
ALTER TABLE `warranty_shipments`
  ADD CONSTRAINT `warranty_shipments_ibfk_1` FOREIGN KEY (`warranty_id`) REFERENCES `warranties` (`id`),
  ADD CONSTRAINT `warranty_shipments_ibfk_2` FOREIGN KEY (`carrier_id`) REFERENCES `carriers` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
