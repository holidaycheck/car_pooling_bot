-- phpMyAdmin SQL Dump
-- version 5.0.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jun 16, 2020 at 09:14 AM
-- Server version: 8.0.20-0ubuntu0.20.04.1
-- PHP Version: 7.4.3

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ccc`
--

-- --------------------------------------------------------

--
-- Table structure for table `joins`
--

CREATE TABLE `joins` (
  `id` int NOT NULL,
  `journey` int NOT NULL,
  `user` varchar(20) NOT NULL,
  `join_time` bigint NOT NULL,
  `workspace` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `journeys`
--

CREATE TABLE `journeys` (
  `id` int NOT NULL,
  `uuid` text NOT NULL,
  `user` varchar(20) NOT NULL,
  `from_location` text NOT NULL,
  `to_location` text NOT NULL,
  `start_date` bigint NOT NULL,
  `time` bigint NOT NULL,
  `person_count` int NOT NULL,
  `create_time` bigint NOT NULL,
  `workspace` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `slack_id` varchar(20) NOT NULL,
  `slack_email` text NOT NULL,
  `slack_name` text NOT NULL,
  `slack_realname` text NOT NULL,
  `workspace` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `workspaces`
--

CREATE TABLE `workspaces` (
  `id` int NOT NULL,
  `domain` varchar(20) NOT NULL,
  `workspace_id` varchar(50) NOT NULL,
  `active` int NOT NULL DEFAULT '0',
  `password` varchar(40) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `joins`
--
ALTER TABLE `joins`
  ADD PRIMARY KEY (`id`),
  ADD KEY `join_id` (`user`),
  ADD KEY `join_journey` (`journey`),
  ADD KEY `joins_workspace` (`workspace`) USING BTREE;

--
-- Indexes for table `journeys`
--
ALTER TABLE `journeys`
  ADD PRIMARY KEY (`id`) USING BTREE,
  ADD KEY `slack_id` (`user`),
  ADD KEY `journeys_workspace` (`workspace`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`) USING BTREE,
  ADD KEY `user_slack_id` (`slack_id`),
  ADD KEY `users_workspace` (`workspace`);

--
-- Indexes for table `workspaces`
--
ALTER TABLE `workspaces`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `workspace_id` (`workspace_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `joins`
--
ALTER TABLE `joins`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `journeys`
--
ALTER TABLE `journeys`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `workspaces`
--
ALTER TABLE `workspaces`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `joins`
--
ALTER TABLE `joins`
  ADD CONSTRAINT `join_journey_to_journey_id` FOREIGN KEY (`journey`) REFERENCES `journeys` (`id`),
  ADD CONSTRAINT `join_user_to_users_slack_id` FOREIGN KEY (`user`) REFERENCES `users` (`slack_id`),
  ADD CONSTRAINT `join_workspace_to_workspace_id` FOREIGN KEY (`workspace`) REFERENCES `workspaces` (`workspace_id`);

--
-- Constraints for table `journeys`
--
ALTER TABLE `journeys`
  ADD CONSTRAINT `journey_user_to_users_slack_id` FOREIGN KEY (`user`) REFERENCES `users` (`slack_id`),
  ADD CONSTRAINT `journey_workspace_to_workspace_id` FOREIGN KEY (`workspace`) REFERENCES `workspaces` (`workspace_id`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `user_workspace_to_workspace_id` FOREIGN KEY (`workspace`) REFERENCES `workspaces` (`workspace_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
