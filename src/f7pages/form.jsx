import React from "react";
import {
  Page,
  Navbar,
  List,
  ListInput,
  ListItem,
  Toggle,
  BlockTitle,
  Button,
  Range,
  Block,
  NavLeft,
  NavTitle,
} from "framework7-react";

const FormPage = () => (
  <Page name="form">
    <Navbar>
      <NavLeft>
        <Button iconF7="arrow_left" href="/" />
      </NavLeft>
      <NavTitle>Form</NavTitle>
    </Navbar>

    <BlockTitle>Form Example</BlockTitle>
    <List strongIos outlineIos dividersIos>
      <ListInput
        outline
        label="Name"
        type="text"
        placeholder="Your name"
      ></ListInput>

      <ListInput
        outline
        label="E-mail"
        type="email"
        placeholder="E-mail"
      ></ListInput>

      <ListInput outline label="URL" type="url" placeholder="URL"></ListInput>

      <ListInput
        outline
        label="Password"
        type="password"
        placeholder="Password"
      ></ListInput>

      <ListInput
        outline
        label="Phone"
        type="tel"
        placeholder="Phone"
      ></ListInput>

      <ListInput outline label="Gender" type="select">
        <option>Male</option>
        <option>Female</option>
      </ListInput>

      <ListInput
        outline
        label="Birth date"
        type="date"
        placeholder="Birth day"
        defaultValue="2014-04-30"
      ></ListInput>

      <ListItem title="Toggle">
        <Toggle slot="after" />
      </ListItem>

      <ListInput outline label="Range" input={false}>
        <Range slot="input" value={50} min={0} max={100} step={1} />
      </ListInput>

      <ListInput
        outline
        type="textarea"
        label="Textarea"
        placeholder="Bio"
      ></ListInput>
      <ListInput
        outline
        type="textarea"
        label="Resizable"
        placeholder="Bio"
        resizable
      ></ListInput>
    </List>

    <BlockTitle>Buttons</BlockTitle>
    <Block strongIos outlineIos className="grid grid-cols-2 grid-gap">
      <Button>Button</Button>
      <Button fill>Fill</Button>

      <Button raised>Raised</Button>
      <Button raised fill>
        Raised Fill
      </Button>

      <Button round>Round</Button>
      <Button round fill>
        Round Fill
      </Button>

      <Button outline>Outline</Button>
      <Button round outline>
        Outline Round
      </Button>

      <Button small outline>
        Small
      </Button>
      <Button small round outline>
        Small Round
      </Button>

      <Button small fill>
        Small
      </Button>
      <Button small round fill>
        Small Round
      </Button>

      <Button large raised>
        Large
      </Button>
      <Button large fill raised>
        Large Fill
      </Button>

      <Button large fill raised color="red">
        Large Red
      </Button>
      <Button large fill raised color="green">
        Large Green
      </Button>
    </Block>

    <BlockTitle>Checkbox group</BlockTitle>
    <List strongIos outlineIos dividersIos>
      <ListItem
        checkbox
        name="my-checkbox"
        value="Books"
        title="Books"
      ></ListItem>
      <ListItem
        checkbox
        name="my-checkbox"
        value="Movies"
        title="Movies"
      ></ListItem>
      <ListItem
        checkbox
        name="my-checkbox"
        value="Food"
        title="Food"
      ></ListItem>
    </List>

    <BlockTitle>Radio buttons group</BlockTitle>
    <List strongIos outlineIos dividersIos>
      <ListItem radio name="radio" value="Books" title="Books"></ListItem>
      <ListItem radio name="radio" value="Movies" title="Movies"></ListItem>
      <ListItem radio name="radio" value="Food" title="Food"></ListItem>
    </List>
  </Page>
);

export default FormPage;
