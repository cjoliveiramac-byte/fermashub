import { render, screen } from "@testing-library/react";
import SiteFooter from "../SiteFooter";

describe("SiteFooter", () => {
  it("renders the copyright line", () => {
    render(<SiteFooter />);
    expect(screen.getByText(/FermasHub/i)).toBeInTheDocument();
    expect(screen.getByText(/Ciro Oliveira/i)).toBeInTheDocument();
  });
});
