ALTER TABLE `FellowshipRosterItem`
  MODIFY `rosterType` ENUM(
    'Saturday_Main_Fellowship',
    'Saturday_Children_Fellowship',
    'Saturday_Youth_Fellowship',
    'Wednesday_Home_Fellowship',
    'House_Fellowship',
    'Womens_Fellowship',
    'Bible_Study',
    'Friday_Evening_Program',
    'Special_Meeting',
    'Outreach_Program',
    'Other_Regular_Program',
    'Custom_Schedule',
    'Prayer_Team_Visit',
    'Night_Prayer',
    'Saturday_Prayer'
  ) NOT NULL;

ALTER TABLE `GeneratedScheduleItem`
  MODIFY `rosterType` ENUM(
    'Saturday_Main_Fellowship',
    'Saturday_Children_Fellowship',
    'Saturday_Youth_Fellowship',
    'Wednesday_Home_Fellowship',
    'House_Fellowship',
    'Womens_Fellowship',
    'Bible_Study',
    'Friday_Evening_Program',
    'Special_Meeting',
    'Outreach_Program',
    'Other_Regular_Program',
    'Custom_Schedule',
    'Prayer_Team_Visit',
    'Night_Prayer',
    'Saturday_Prayer'
  ) NOT NULL;
