import React, { useCallback, useMemo, useState } from 'react';
import FuzzySearch from 'fuzzy-search';

import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import { IconButton, TextField } from '@material-ui/core';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { Chip, List } from '@material-ui/core';
import { motion } from 'framer-motion';
import Typography from '@material-ui/core/Typography';
import Image from 'next/image';
import Snackbar from '@material-ui/core/Snackbar';
import Slide from '@material-ui/core/Slide';

import FileCopyOutlinedIcon from '@material-ui/icons/FileCopyOutlined';

const useStyles = makeStyles((theme) => ({
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    height: '90vh',
  },
  list: {
    width: '100%',
    overflow: 'auto',
    maxHeight: '400px',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    flex: '0 0 auto',
    justifyContent: 'space-between',
  },
  listRoot: {
    backgroundColor: theme.palette.background.paper,
  },
  card: {
    minHeight: '20%',
  },
}));

function SlideTransition(props) {
  return <Slide {...props} direction="left" />;
}

// dataReceived has objects of following type
//{ name: string,
//  description: string,
//} chunks: string []

const Collection = ({ dataReceived }) => {
  const classes = useStyles();
  // to set the initial collection as the first collection
  var defaultStateName = '';
  if (dataReceived.length > 0) {
    defaultStateName = dataReceived[0].name;
  }
  // chosenCollection object's name is used as unique id to get the collection name,as name property is used as key on server-side
  // and this chsenItem's name property is used to get the description and chunks from fetched data
  const [chosenCollection, setChosenCollection] = useState({ name: defaultStateName });
  const chooseCollection = (name) => {
    if (name != chosenCollection.name) {
      setChosenCollection({ name: name });
    }
  };

  const getCollectionObject = (objects, name) => {
    if (!objects.length) {
      return {};
    }
    const chosenCollectionObject = objects.find((object) => object.name === name);
    return chosenCollectionObject;
  };
  const { description, chunks } = getCollectionObject(dataReceived, chosenCollection.name);

  // FUZZY SEARCH
  const fuzSearch = useMemo(() => {
    return new FuzzySearch(dataReceived, ['name']);
  }, [dataReceived]);
  const [keyword, setKeyword] = useState('');
  const filteredCollection = useMemo(
    () => (keyword ? fuzSearch.search(keyword) : dataReceived),
    [fuzSearch, keyword, dataReceived]
  );

  // Saving to clipboard
  const [shouldShowSnackbar, setSnackbarVisibility] = useState(false);
  const hideSnackbar = useCallback(() => setSnackbarVisibility(false), []);
  const handleCopy = useCallback(() => {
    //eslint-disable-next-line
    navigator.clipboard?.writeText([...chunks].join()).then(() => setSnackbarVisibility(true));
  }, [chunks]);

  return (
    <Box className={classes.mainContent} p={5}>
      {!dataReceived.length ? (
        <Box display="flex" flexDirection="column" height="100%" justifyContent="center" alignItems="center">
          <Image src="/no-data.svg" height={200} width={200} alt="no collections"></Image>
          <Typography variant="h5" component="h2">
            No Collection Available!
          </Typography>
          <Typography>Your saved collections will appear here.</Typography>
        </Box>
      ) : (
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="flex-start"
          m={1}
          borderRadius="borderRadius"
          minHeight="50vh"
        >
          <Box display="flex" justifyContent="space-between" m={1}>
            {/*input field for to search for a Collection*/}
            <TextField
              variant="outlined"
              style={{ marginBottom: '20px', width: '35%' }}
              label="Search Collection"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
              }}
            />
          </Box>
          {/*Box which contains the List of collection and preview boxes */}
          <Box display="flex" flexDirection="row" justifyContent="space-between">
            <Box
              width="35%"
              flex="0 0 auto"
              //border="1px solid white"
              borderRadius="borderRadius"
              className={classes.listRoot}
              m={1}
            >
              {!filteredCollection ? (
                <div>Make Collections To See Them Here</div>
              ) : (
                <List className={classes.list} component="nav">
                  {filteredCollection.map((item) => (
                    <ListItem
                      button
                      onClick={() => {
                        chooseCollection(item.name);
                      }}
                      key={item.name}
                      data-name={item.name}
                      selected={chosenCollection.name === item.name}
                    >
                      <ListItemText primary={item.name} />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
            <Box
              overflow="auto"
              flex="1 1 auto"
              minHeight="40vh"
              borderRadius="borderRadius"
              border="1px solid white"
              color="primary.main"
              m={1}
            >
              {/*Showing the name and description on chunk Collection */}
              <Box className={classes.card}>
                <Box display="flex" flexDirection="row">
                  <Box p={1} m={1} width={2 / 6}>
                    <Typography color="textSecondary">Collection Title</Typography>
                    <Typography variant="h5" component="h2">
                      {chosenCollection.name}
                    </Typography>
                  </Box>
                  <Box p={1} m={1} width={3 / 6}>
                    <Typography color="textSecondary">Description</Typography>
                    <Typography variant="body2" component="p">
                      {description}
                    </Typography>
                  </Box>
                  <Box p={1} m={1} width={1 / 6} display="flex" justifyContent="flex-end">
                    <IconButton onClick={handleCopy} disabled={!chunks.length} aria-label="copy">
                      <FileCopyOutlinedIcon />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
              {/*Showing chunks in chosen collection */}
              <Box borderRadius="borderRadius" borderColor="primary.main" p={1} overflow="auto">
                {chunks?.map((chunk) => (
                  <motion.div
                    key={chunk}
                    style={{ display: 'inline-block' }}
                    animate={{ scale: 1 }}
                    initial={{ scale: 0.5 }}
                  >
                    <Box p={1}>
                      <Chip label={chunk} variant="outlined" data-chunk-name={chunk} />
                    </Box>
                  </motion.div>
                ))}
              </Box>
            </Box>
          </Box>
          <Snackbar
            open={shouldShowSnackbar}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            autoHideDuration={2000}
            onClose={hideSnackbar}
            TransitionComponent={SlideTransition}
            message={`${chunks.length} chunks copied`}
          />
        </Box>
      )}
    </Box>
  );
};

export default Collection;
