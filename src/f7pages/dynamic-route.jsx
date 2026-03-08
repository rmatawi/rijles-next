import React from 'react';
import { Page, Navbar, Block, Link, NavLeft, NavTitle } from 'framework7-react';
import useAppNavigation from "../hooks/useAppNavigation";

const DynamicRoutePage = (props) => {
  const { back } = useAppNavigation();
  const { f7route } = props;
  return (
    <Page>
      <Navbar>
        <NavLeft>
          <button type="button" onClick={back} style={{ background: "none", border: "none", cursor: "pointer" }}>
            Back
          </button>
        </NavLeft>
        <NavTitle>Dynamic Route</NavTitle>
      </Navbar>
      <Block strong inset>
        <ul>
          <li>
            <b>Url:</b> {f7route.url}
          </li>
          <li>
            <b>Path:</b> {f7route.path}
          </li>
          <li>
            <b>Hash:</b> {f7route.hash}
          </li>
          <li>
            <b>Params:</b>
            <ul>
              {Object.keys(f7route.params).map((key) => (
                <li key={key}>
                  <b>{key}:</b> {f7route.params[key]}
                </li>
              ))}
            </ul>
          </li>
          <li>
            <b>Query:</b>
            <ul>
              {Object.keys(f7route.query).map((key) => (
                <li key={key}>
                  <b>{key}:</b> {f7route.query[key]}
                </li>
              ))}
            </ul>
          </li>
          <li>
            <b>Route:</b> {f7route.route.path}
          </li>
        </ul>
      </Block>
      <Block strong inset>
        <Link onClick={back}>Go back via Router API</Link>
      </Block>
    </Page>
  );
};

export default DynamicRoutePage;
