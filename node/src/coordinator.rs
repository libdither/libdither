//! This crate implements provides traits and implementations for algorithms assigning coordinates to nodes.
//! Adapted from the Vivaldi Protocol: https://pdos.csail.mit.edu/papers/vivaldi:sigcomm/paper.pdf

use std::ops::{Sub};

use num::{Float};

/// Trait for a CoordinateSystem as defined in the Vivaldi paper
pub trait CoordinateType: Clone + Default {
    type Scalar: Float;
    fn subtract(self, other: &Self) -> Self;
    fn add(self, other: &Self) -> Self;
    fn length(&self) -> Self::Scalar;
    fn multiply(self, scalar: Self::Scalar) -> Self;
    fn distance(&self, other: &Self) -> Self::Scalar {
        let mut out = self.clone();
        out.subtract(other);
        out.length()
    }
    fn normalized(mut self) -> Self {
        self.multiply(self.length().recip());
        self
    }
}
/// Trait for a Coordinator.
pub trait NodeCoordinator: Default {
    type Coord: CoordinateType;
    type RemoteState;
    /// Update the system 
    fn update(&mut self, remotes: impl Iterator<Item = &mut Self::RemoteState>);
}

/// Coordinate with format Distance-Distance-Height using f64 as a scalar
#[derive(Clone)]
struct CoordDDHf64 {
    position: nalgebra::Vector2<f64>,
    height: f64,
}
impl CoordinateType for CoordDDHf64 {
    type Scalar = f64;

    fn subtract(&mut self, other: &Self) {
        self.position -= other.position;
        self.height += other.height;
    }

    fn add(&mut self, other: &Self) {
        self.position += other.position;
        self.height += other.height;
    }

    fn length(&self) -> Self::Scalar {
        self.position.magnitude() + self.height
    }

    fn multiply(&mut self, scalar: Self::Scalar) {
        self.position *= scalar;
        self.height *= scalar;
    }
}

#[derive(Debug, Default)]
struct VivaldiAdaptiveCoordinator<Coord: CoordinateType, const ERROR_CONST: f64, const MOVE_CONST: f64 = 0.25> {
    coord: Coord,
    error: f64,
}
struct VivaldiAdaptiveCoordinatorRemoteState<Coord: CoordinateType> {
    coord: Coord,
    error: f64,
    measured_distance: f64,
}
impl<Coord: CoordinateType, const ADAPT_CONST: f64, const ERROR_CONST: f64> NodeCoordinator for VivaldiAdaptiveCoordinator<Coord, ERROR_CONST, ADAPT_CONST> {
    type Coord = Coord;

    type RemoteState = VivaldiAdaptiveCoordinatorRemoteState<Coord>;

    fn update<'a>(&mut self, remotes: impl Iterator<Item = &'a mut Self::RemoteState>) {
        for remote in remotes {
            // Algorithm as found here: https://pdos.csail.mit.edu/papers/vivaldi:sigcomm/paper.pdf#page=4

            // Coordinate space relative displacement of the remote node
            let mut displacement = self.coord.clone().subtract(&remote.coord); // x_i - x_j
            
            // Estimate of distance of the remote node
            let distance_estimate = displacement.length(); // ||x_i - x_j||

            // Error is the absolute difference between the measured and estimated distances to the remote node.
            let sample_error: f64 = remote.measured_distance.sub(distance_estimate); // rtt - ||x_j - x_j||
            let relative_sample_error = sample_error.abs() / remote.measured_distance; // e_s = | ||x_j - x_j|| - rtt | / rtt

            // Relative direction of the remote node
            let dir = displacement.normalized(); // u(x_i - x_j)

            // The higher our error is, the more remotes with lower errors effect our coordinates.
            let sample_error_weight = self.error / (self.error + remote.error); // w = e_i / (e_i + e_j)

            // Update moving average of this node's error
            self.error = relative_sample_error * ERROR_CONST * sample_error_weight + self.error * (1 - ERROR_CONST * sample_error_weight); // e_i = ...

            // Timestep scales with error
            let delta = ADAPT_CONST * sample_error_weight; // δ = c_e * w
            // Move coord
            self.coord.add((delta * sample_error) * dir);
        }
    }
}

#[derive(Debug, Default)]
struct PhoenixCoordinator<const EARLY_HOST_THRESHOLD: usize, const LAMBDA: f64> {
    
}
struct PhoenixCoordinatorRemoteState {

}

fn main() {
    println!("Hello, world!");
}
